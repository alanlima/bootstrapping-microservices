const express = require("express");
const http = require("http");

const app = express();
const PORT = process.env.PORT || 3000;
const VIDEO_STORAGE_HOST = process.env.VIDEO_STORAGE_HOST;
const VIDEO_STORAGE_PORT = parseInt(process.env.VIDEO_STORAGE_PORT);

// Registers a HTTP get route for video streamming
app.get("/video", (req, res) => {
  const forwardRequest = http.request({
    host: VIDEO_STORAGE_HOST,
    port: VIDEO_STORAGE_PORT,
    path: `/video?path=SampleVideo.mp4`,
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

  // const videoPath = path.join('./videos', 'SampleVideo_1280x720_1mb.mp4');
  // fs.stat(videoPath, (err, stats) => {
  //   if(err) {
  //     console.error('An error occurred', err);
  //     res.sendStatus(500);
  //     return;
  //   }

  //   res.writeHead(200, {
  //     'Content-Length': stats.size,
  //     'Content-Type': 'video/mp4'
  //   });
  //   fs.createReadStream(videoPath).pipe(res);
  // })
});

/**
 * Starts the HTTP server
 */
app.listen(PORT, () => {
  console.log(`Microservice listening on port ${PORT}, point your browser at localhost:${PORT}/video`);
})