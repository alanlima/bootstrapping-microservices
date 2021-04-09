const express = require("express");
const {
  BlobServiceClient,
  StorageSharedKeyCredential,
} = require("@azure/storage-blob");

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
  const sharedKeyCredential = new StorageSharedKeyCredential(
    STORAGE_ACCOUNT_NAME,
    STORAGE_ACCESS_KEY
  );

  const blobService = new BlobServiceClient(
    `https://${STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
    sharedKeyCredential
  );
  return blobService;
}

function handleError(err, res, blobFullPath) {
  if (err.statusCode === 404) {
    res.status(404).send(`File [${blobFullPath}] could not be found`);
    return;
  }
  console.error(
    `Error occurred getting properties for video ${blobFullPath}`,
    err.message
  );
  res.sendStatus(500);
}

app.get("/video", async (req, res) => {
  const videoPath = req.query.path;
  console.log(`Streaming video from path ${videoPath}`);

  const blobService = createBlobService();
  const containerName = "videos";
  const containerClient = blobService.getContainerClient(containerName);
  const blobClient = containerClient.getBlobClient(videoPath);

  try {
    const blobResponse = await blobClient.download(0);
    res.writeHead(200, {
      "Content-Length": blobResponse.contentLength,
      "Content-type": "video/mp4",
    });

    blobResponse.readableStreamBody.pipe(res);
  } catch (error) {
    handleError(error, res, videoPath);
  }
});

app.listen(PORT, () => {
  console.log(
    `Serving videos from Azure storage account ${STORAGE_ACCOUNT_NAME}`
  );
  console.log(`AzureStorage Microservice listening on port ${PORT}`);
});
