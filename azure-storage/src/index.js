const express = require("express");
const azure = require("azure-storage");

const app = express();

/**
 * Throws an error if the any required environment variables are missing.
 */
const requiredVariables = [
  {
    key: "STORAGE_ACCOUNT_NAME",
    error:
      "Please specify the name of an azure storage account in environment variable STORAGE_ACCOUNT_NAME",
  },
  {
    key: "STORAGE_ACCESS_KEY",
    error:
      "Please specify the access key to an Azure storage account in environment variable STORAGE_ACCESS_KEY",
  },
];

requiredVariables.forEach(({ key, error }) => {
  if (!process.env[key]) throw new Error(error);
});

/**
 * Extracts environment variables to globals for convenience.
 */

const PORT = process.env.PORT || 8080;
const STORAGE_ACCOUNT_NAME = process.env.STORAGE_ACCOUNT_NAME;
const STORAGE_ACCESS_KEY = process.env.STORAGE_ACCESS_KEY;

/**
 * Create the Blob service API to communicate with Azure storage.
 */
function createBlobService() {
  const blobService = azure.createBlobService(
    STORAGE_ACCOUNT_NAME,
    STORAGE_ACCESS_KEY
  );
  blobService.logger.level = process.env.DEBUG
    ? azure.Logger.LogLevels.DEBUG
    : azure.Logger.LogLevels.INFO;
  return blobService;
}

function handleError(err, res, blobFullPath) {
  if(err.statusCode === 404) {
    res.status(404).send(`File [${blobFullPath}] could not be found`);
    return;
  }
  console.error(
    `Error occurred getting properties for video ${blobFullPath}`,
    err
  );
  console.error((err && err.stack) || err);
  res.sendStatus(500);
}

app.get("/video", (req, res) => {
  const videoPath = req.query.path;
  console.log(`Streaming video from path ${videoPath}`);

  const blobService = createBlobService();
  const containerName = "videos";
  const blobFullPath = `${containerName}/${videoPath}`;

  // Sends a HTTP HEAD request to retreive video size.
  blobService.getBlobProperties(containerName, videoPath, (err, properties) => {
    if (err) {
      handleError(err, res, blobFullPath);
      return;
    }

    // Writes HTTP headers to the response
    res.writeHead(200, {
      "Content-Length": properties.contentLength,
      "Content-type": "video/mp4",
    });

    // Streams the video from Azure storage to the response

    blobService.getBlobToStream(containerName, videoPath, res, (err) => {
      if (err) {
        console.error(
          `Error occurred getting video ${blobFullPath} to stream`
        );
        console.error((err && err.stack) || err);
        res.sendStatus(500);
        return;
      }
    });
  });
});

app.listen(PORT, () => {
  console.log(
    `Serving videos from Azure storage account ${STORAGE_ACCOUNT_NAME}`
  );
  console.log("AzureStorage Microservice Online");
});
