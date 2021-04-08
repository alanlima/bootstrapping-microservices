const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;


/**
 * Registers a HTTP get route for video streamming
 */
app.get("/video", (req, res) => {
  const videoPath = path.join('./videos', 'SampleVideo_1280x720_1mb.mp4');
  fs.stat(videoPath, (err, stats) => {
    if(err) {
      console.error('An error occurred', err);
      res.sendStatus(500);
      return;
    }

    res.writeHead(200, {
      'Content-Length': stats.size,
      'Content-Type': 'video/mp4'
    });
    fs.createReadStream(videoPath).pipe(res);
  })
});

/**
 * Starts the HTTP server
 */
app.listen(port, () => {
  console.log(`Microservice listening on port ${port}, point your browser at localhost:${port}/video`);
})