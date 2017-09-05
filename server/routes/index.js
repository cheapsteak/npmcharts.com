const express = require('express');
const arrayToSentence = require('array-to-sentence');
const querystring = require("querystring");
const router = express.Router();

const getTitle = require('../utils/getTitle');

/* GET home page. */
router.get('/', function(req, res, next) {
  const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
  res.render('index', {
    title: getTitle(),
    oembedUrl: `https://npmcharts.com/oembed?${querystring.stringify({url: fullUrl, format: 'json'})}`,
  });
});

router.get('/compare/:packages*', function(req, res, next) {
  const packages = req.params.packages.split(',');
  const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
  res.render('index', {
    title: getTitle(packages),
    oembedUrl: `https://npmcharts.com/oembed?${querystring.stringify({url: fullUrl, format: 'json'})}`,
  });
});

module.exports = router;

