const express = require('express');
const router = express.Router();

const getChartImage = require('../utils/getChartImage');
const getMinimalUrl = require('../utils/getMinimalUrl');
const shouldScreencapUrl = require('../utils/shouldScreencapUrl');

router.get('/', async function(req, res, next) {
  if (!req.query.url) {
    res.status(400).send({
      message: 'Please pass a url on the query string',
    });
  } else if (!shouldScreencapUrl(req.query.url)) {
    // send the fallback image for invalid urls
    res.redirect('https://npmcharts.com/images/og-image-3.png');
  } else {
    try {
      const imageBuffer = await getChartImage(getMinimalUrl(req.query.url));
      res.contentType('image/png');
      res.send(imageBuffer);
    } catch (e) {
      console.error(e);
      res.status(500).send({ error: e.toString() });
    }
  }
});

module.exports = router;
