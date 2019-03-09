const fs = require('fs');
const express = require('express');
const filesize = require('filesize');
const debug = require('debug')('server:server');

const SCREENSHOT_DIR = require('configs/SCREENSHOT_DIR');
const getChartImage = require('utils/getChartImage');
const getMinimalUrl = require('utils/getMinimalUrl');
const shouldScreencapUrl = require('utils/shouldScreencapUrl');

const router = express.Router();

router.get('/folder-size', function(req, res, next) {
  debug('sending screenshot directory folder-size');
  try {
    res.send({ size: filesize(fs.statSync(SCREENSHOT_DIR).size) });
  } catch (e) {
    debug('error sending folder size', e);
    res.status(500).send({ error: e.toString() });
  }
});

router.get('/', async function(req, res, next) {
  debug('chart image route');
  if (!req.query.url) {
    debug('no url passed');
    res.status(400).send({
      message: 'Please pass a url on the query string',
    });
  } else if (!shouldScreencapUrl(req.query.url)) {
    debug('path doesnt require dynamic screencap');
    // send the fallback image for invalid urls
    res.redirect('https://npmcharts.com/images/og-image-3.png');
  } else {
    try {
      debug(
        `attempting to get chart image for: ${getMinimalUrl(req.query.url)}`,
      );
      const imageBuffer = await getChartImage(getMinimalUrl(req.query.url));
      res.contentType('image/png');
      res.send(imageBuffer);
    } catch (e) {
      debug.error('error generating dynamic image', e);
      res.status(500).send({ error: e.toString() });
    }
  }
});

module.exports = router;
