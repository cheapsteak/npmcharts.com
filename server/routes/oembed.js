const url = require('url');
const express = require('express');
const cors = require('cors');
const router = express.Router();

const getOembedObject = require('../utils/getOembedObject');

router.get('/', cors(), function(req, res, next) {
  const incomingUrl = url.parse(req.query.url);
  const oembed = getOembedObject({
    url: req.query.url,
    width: req.query.maxwidth || 700,
    height: req.query.maxheight || 500,
  });
  if (incomingUrl) {
    res.send(oembed);
  } else {
    res.status(400).send({
      message: 'Please pass a url on the query string',
    });
  }
});

module.exports = router;
