const express = require('express');
const router = express.Router();

router.get('/', function(req, res, next) {
  const incomingUrl = req.query.url;
  const embedUrl = incomingUrl+'?minimal';
  const width = req.query.maxwidth || 700;
  const height = req.query.maxheight || 500;
  const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
  if (incomingUrl) {
    res.send({
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        type: 'rich',
        version: '1.0',
        provider_name: 'npmcharts',
        provider_url: "https://npmcharts.com",
        width: width,
        height: height,
        html: `<!DOCTYPE html>
          <html>
              <head>
                  <meta charset="UTF-8">
                  <style>
                  html, body { padding: 0; margin: 0; }
                  </style>
              </head>
              <body>
                  <iframe
                      style="width: 100%; overflow: hidden;"
                      src="${embedUrl}"
                      width="500"
                      height="${height}"
                      frameborder="0"
                      scrolling="no"
                  ></iframe>
              </body>
          </html>
          `
      }
    });
  } else {
    res
      .status(400)
      .send({
        message: 'Please pass a url on the query string',
      });
  }
});

module.exports = router;

