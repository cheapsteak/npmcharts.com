const url = require('url');
const express = require('express');
const cors = require('cors');
const router = express.Router();

const route = require('path-match')({
  // path-to-regexp options 
  sensitive: false,
  strict: false,
  end: false,
});
const getTitle = require('../utils/getTitle');

const match = route('/compare/:packages([^/]+/[^/]+)');

router.get('/', cors(), function(req, res, next) {
  const incomingUrl = req.query.url;
  const incomingUrlParams = match(url.parse(incomingUrl).pathname);
  const packages = incomingUrlParams.packages && incomingUrlParams.packages.split(',');
  const embedUrl = incomingUrl+'?minimal=true';
  const width = req.query.maxwidth || 700;
  const height = req.query.maxheight || 500;
  const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
  if (incomingUrl) {
    res.send({
        type: 'rich',
        version: '1.0',
        provider_name: 'npmcharts',
        provider_url: "https://npmcharts.com",
        title: getTitle(packages),
        width: width,
        height: height,
        packages: packages,
        html: `<iframe
            style="width: 100%; overflow: hidden;"
            src="${embedUrl}"
            width="${width}"
            height="${height}"
            frameborder="0"
            scrolling="no"
        ></iframe>`.replace(/\s\s+/g, ' ')
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

