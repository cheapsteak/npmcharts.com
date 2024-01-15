import * as url from 'url';
import express from 'express';
import cors from 'cors';

import { getOembedObject } from 'utils/getOembedObject.js';

const router = express.Router();

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

export default router;
