const express = require('express');
const cachios = require('cachios');
const LRU = require('lru-cache');

cachios.cache = LRU({
  max: 500,
  maxAge: 60 * 1000,
});

const router = express.Router();

// Can't use http-proxy-middleware because it triggers
// Cloudflare's Error 1000 DNS points to prohibited IP
router.get('/downloads*', async (req, res) => {
  const proxiedPath = `https://api.npmjs.org${req.path.replace(/^api/, '')}`;
  try {
    return res.send((await cachios.get(proxiedPath)).data);
  } catch (exception) {
    console.error(exception);
  }
});

module.exports = router;
