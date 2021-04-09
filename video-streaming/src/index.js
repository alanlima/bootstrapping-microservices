const express = require("express");
const http = require("http");
const mongodb = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;
const VIDEO_STORAGE_HOST = process.env.VIDEO_STORAGE_HOST;
const VIDEO_STORAGE_PORT = parseInt(process.env.VIDEO_STORAGE_PORT);
const DBHOST = process.env.DBHOST;
const DBNAME = process.env.DBNAME;

async function main () {
  const client = await mongodb.MongoClient.connect(DBHOST);
  const db = client.db(DBNAME);
  const videosCollection = db.collection("videos");
  // Registers a HTTP get route for video streamming
  app.get("/video", (req_1, res) => {

    const videoId = new mongodb.ObjectId(req_1.query.id);
    videosCollection
      .findOne({ _id: videoId })
      .then(videoRecord => {
        if (!videoRecord) {
          res.sendStatus(404);
          return;
        }

        const forwardRequest = http.request({
          host: VIDEO_STORAGE_HOST,
          port: VIDEO_STORAGE_PORT,
          path: `/video?path=${videoRecord.videoPath}`,
          method: 'GET',
          headers: req_1.headers,
        }, forwardResponse => {
          res.writeHead(
            forwardResponse.statusCode,
            forwardResponse.headers
          );
          forwardResponse.pipe(res);
        });

        req_1.pipe(forwardRequest);
      })
      .catch(err => {
        console.error("Database query failed.");
        console.error(err && err.stack || err);
        res.sendStatus(500);
      });
  });
  /**
   * Starts the HTTP server
   */
  app.listen(PORT, () => {
    console.log(`Microservice listening on port ${PORT}, point your browser at localhost:${PORT}/video`);
  });
}

main()
  .then(() => {
    console.log("Microservice online")
  })
  .catch(err => {
    console.error('Microservice failed to start');
    console.error(err && err.stack || err);
  });