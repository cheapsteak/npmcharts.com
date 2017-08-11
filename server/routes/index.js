const express = require('express');
const arrayToSentence = require('array-to-sentence');
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Compare download stats for npm packages - npmcharts' });
});

router.get('/compare/:packages', function(req, res, next) {
  const packages = req.params.packages.split(',');
  res.render('index', { title: "Compare npm downloads for " + arrayToSentence(packages) + " - npmcharts" });
});

module.exports = router;
