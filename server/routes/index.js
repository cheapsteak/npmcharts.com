const express = require('express');
const arrayToSentence = require('array-to-sentence');
const querystring = require("querystring");
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
  res.render('index', {
    title: 'Compare download trends of npm packages - npmcharts 📈',
    oembedUrl: `https://npmcharts.com/oembed?${querystring.stringify({url: fullUrl, format: 'json'})}`,
  });
});

router.get('/compare/:packages*', function(req, res, next) {
  const packages = req.params.packages.split(',');
  const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
  res.render('index', {
    title: 'Compare npm downloads for ' + arrayToSentence(packages) + ' - npmcharts 📈',
    oembedUrl: `https://npmcharts.com/oembed?${querystring.stringify({url: fullUrl, format: 'json'})}`,
  });
});

module.exports = router;

