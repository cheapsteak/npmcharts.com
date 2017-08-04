var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/compare/:packages', function(req, res, next) {
  console.log(req.params.packages.split(','));
  res.render('index', { title: 'Express' });
});

module.exports = router;
