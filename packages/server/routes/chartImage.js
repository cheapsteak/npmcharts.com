const querystring = require('querystring');
const express = require('express');
const debug = require('debug')('server:server');
const getChartImage = require('utils/getChartImage');
const router = express.Router();

router.get('/:packages*', async function(req, res, next) {
  debug('chart image route');
  const protocol = req.protocol;
  const host = req.get('host');
  const pathname = req.originalUrl;

  const packages =
    pathname
      .replace(/^\/chart-image\//, '')
      .replace(/\.png$/, '')
      .split(',') || [];
  if (!packages.length) {
    debug('path doesnt require dynamic screencap');
    // send the fallback image for invalid urls
    res.redirect('https://npmcharts.com/images/og-image-3.png');
  } else {
    try {
      const queryString = querystring.stringify({ minimal: true });
      const packagesString = packages.join(',');
      const urlToScreencap = `${protocol}://${host}/compare/${packagesString}?${queryString}`;
      debug(`attempting to get chart image for: ${urlToScreencap}`);
      const imageBuffer = await getChartImage(urlToScreencap);
      res.contentType('image/png');
      res.send(imageBuffer);
    } catch (e) {
      debug.error('error generating dynamic image', e);
      res.status(500).send({ error: e.toString() });
    }
  }
});

module.exports = router;
