const express = require('express');
const cachios = require('cachios');
const LRU = require('lru-cache');

cachios.cache = LRU({
  max: 1000,
  maxAge: 5 * 60 * 1000,
});

const router = express.Router();

// Can't use http-proxy-middleware because it triggers
// Cloudflare's Error 1000 DNS points to prohibited IP
router.get('/downloads*', async (req, res) => {
  const reqPath = req.path.replace(/^api\//, '');
  const proxiedPath = `https://api.npmjs.org/${reqPath}`;
  try {
    return res.send((await cachios.get(proxiedPath)).data);
  } catch (exception) {
    console.error(exception);
    res.status(exception.response.status).send(exception.response.data);
  }
});

router.get('/npm-registry*', async (req, res) => {
  const reqPath = req.path.replace(/^\/npm-registry\//, '');
  console.log(reqPath);
  const proxiedPath = `https://registry.npmjs.org/${reqPath}`;
  try {
    return res.send((await cachios.get(proxiedPath)).data.time);
  } catch (exception) {
    console.error(exception);
    res.status(exception.response.status).send(exception.response.data);
  }
});

module.exports = router;
