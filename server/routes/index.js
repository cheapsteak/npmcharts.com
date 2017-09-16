const url = require('url');
const querystring = require("querystring");
const express = require('express');
const arrayToSentence = require('array-to-sentence');
const router = express.Router();

const getTitle = require('../utils/getTitle');

const sendSPA = function(req, res, next) {
  const packages = req.params.packages ? req.params.packages.split(',') : [];
  const fullUrl = url.parse(req.protocol + '://' + req.get('host') + req.originalUrl);
  res.render('index', {
    title: getTitle(packages),
    oembedUrl: `https://npmcharts.com/oembed?${querystring.stringify({url: fullUrl.href, format: 'json'})}`,
    isEmbed: !!req.query.minimal,
    canonicalUrl: `https://npmcharts.com${fullUrl.pathname}`,
  });
}

/* GET home page. */
router.get('/', sendSPA);
router.get('/compare/:packages*', sendSPA);

module.exports = router;

