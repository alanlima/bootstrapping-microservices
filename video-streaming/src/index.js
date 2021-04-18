const express = require("express");
const http = require("http");
const mongodb = require('mongodb');
const amqp = require('amqplib');

const app = express();
const PORT = process.env.PORT || 3000;
const VIDEO_STORAGE_HOST = process.env.VIDEO_STORAGE_HOST;
const VIDEO_STORAGE_PORT = parseInt(process.env.VIDEO_STORAGE_PORT);
const DBHOST = process.env.DBHOST;
const DBNAME = process.env.DBNAME;
const RABBIT = process.env.RABBIT;


/**
 * Establish a connection with the RabbitMQ server
 * @returns {amqp.Channel} the created channel instance
 */
async function connectRabbit() {
  console.log(`Connecting to RabbitMQ server at ${RABBIT}`);
  const messagingConnection = await amqp.connect(RABBIT);
  console.log('Connected to RabbitMQ');
  const channel = await messagingConnection.createChannel();
  await channel.assertExchange("viewed", "fanout");
  return channel;
}

/**
 * Send the "viewed" to the history microservice.
 * @param {amqp.Channel} messageChannel
 * @param {string} videoPath 
 */
function sendViewerMessage(messageChannel, videoPath) {
  console.log(`Publishing message on 'viewed' queue`);
  const msg = JSON.stringify({ videoPath });
  // Publish message to "viewed" queue
  messageChannel.publish('viewed', '', Buffer.from(msg));
}

async function main () {
  const client = await mongodb.MongoClient.connect(DBHOST, {
    useUnifiedTopology: true
  });
  const db = client.db(DBNAME);
  const videosCollection = db.collection("videos");
  const messageChannel = await connectRabbit();
  // Registers a HTTP get route for video streamming
  app.get("/video", (req, res) => {

    console.log(JSON.stringify(req.headers));

    const videoId = new mongodb.ObjectId(req.query.id);
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
          headers: req.headers,
        }, forwardResponse => {
          res.writeHead(
            forwardResponse.statusCode,
            forwardResponse.headers
          );
          forwardResponse.pipe(res);
        });

        req.pipe(forwardRequest);

        if(!req.headers.referer) {
          sendViewerMessage(messageChannel, videoRecord.videoPath);
        }
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