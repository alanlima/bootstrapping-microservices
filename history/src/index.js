const express = require('express');
const amqp = require('amqplib');
const mongodb = require('mongodb');
const { json: jsonParser } = require('body-parser');

if(!process.env.DBHOST) {
  throw new Error('Please specify the database host using environment variable DBHOST');
}

if(!process.env.DBNAME) {
  throw new Error('Please specify the name of the database using environment variable DBNAME');
}

if(!process.env.RABBIT) {
  throw new Error('Please specify the name of the RabbitMQ host using environment variable RABBIT');
}

const DBHOST = process.env.DBHOST;
const DBNAME = process.env.DBNAME;
const RABBIT = process.env.RABBIT;

/**
 * Connect to the database
 * @returns MongoDB database connection
 */
async function connectDb() {
  const client = await mongodb.MongoClient.connect(DBHOST);
  return client.db(DBNAME);
}

async function connectRabbit() {
  console.log(`Connecting to RabbitMQ server at ${RABBIT}`);
  const messagingConnection = await amqp.connect(RABBIT);
  console.log('Connected to RabbitMQ');
  return await messagingConnection.createChannel();
}

async function setupHandlers(app, db, messageChannel) {
  const videosCollection = db.collection("videos-history");

  const consumeViewedMessage = async (msg) => {
    console.log('Received a viewed message');

    const parsedMsg = JSON.parse(msg.content.toString());

    await videosCollection.insertOne({
      videoPath: parsedMsg.videoPath
    });

    messageChannel.ack(msg);
  };

  await messageChannel.assertQueue('viewed', {});
  console.log('Asserted that the viewed queue exists');
  messageChannel.consume('viewed', consumeViewedMessage);
}

function startHttpServer(db, messageChannel) {
  return new Promise(async resolve => {
    const app = express();
    app.use(jsonParser());
    await setupHandlers(app, db, messageChannel);
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      resolve();
    });
  });
}

async function main() {
  const db = await connectDb();
  const messageChannel = await connectRabbit();
  return await startHttpServer(db, messageChannel);
}

main()
  .then(() => console.log('History microservice online'))
  .catch(err => {
    console.error("microservice failed to start");
    console.error(err && err.stack || err);
  });