const url = require('url');
const querystring = require('querystring');
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
  const incomingUrl = url.parse(req.query.url);
  const routeParams = match(incomingUrl.pathname);
  const queryParams = querystring.parse(incomingUrl.query);
  const packages = routeParams.packages && routeParams.packages.split(',');
  const outgoingQueryParams = querystring.stringify(Object.assign({}, queryParams, {minimal: true}));
  const embedUrl = `https://${incomingUrl.host}/${incomingUrl.pathname}?${outgoingQueryParams}`;
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

