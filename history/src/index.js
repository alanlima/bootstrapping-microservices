const express = require('express');

function setupHandlers(app) {
  console.log('hi there')
}

function startHttpServer() {
  return new Promise(resolve => {
    const app = express();
    setupHandlers(app);
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      resolve();
    });
  })
}

function main() {
  return startHttpServer();
}

main()
  .then(() => console.log('History microservice online'))
  .catch(err => {
    console.error("microservice failed to start");
    console.error(err && err.stack || err);
  });