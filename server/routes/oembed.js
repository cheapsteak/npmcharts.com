const express = require('express');
const cors = require('cors');
const router = express.Router();

router.get('/', cors(), function(req, res, next) {
  const incomingUrl = req.query.url;
  const embedUrl = incomingUrl+'?minimal';
  const width = req.query.maxwidth || 700;
  const height = req.query.maxheight || 500;
  const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
  if (incomingUrl) {
    res.send({
        type: 'rich',
        version: '1.0',
        provider_name: 'npmcharts',
        provider_url: "https://npmcharts.com",
        width: width,
        height: height,
        html: `<iframe
            style="width: 100%; overflow: hidden;"
            src="${embedUrl}"
            width="500"
            height="${height}"
            frameborder="0"
            scrolling="no"
        ></iframe>`,
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

