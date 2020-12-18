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

router.get('/npm-metadata*', async (req, res) => {
  const reqPath = req.path.replace(/^\/npm-metadata\//, '');
  const proxiedPath = `https://registry.npmjs.org/${reqPath}`;
  try {
    const npmRegistryData = (await cachios.get(proxiedPath)).data;
    const latestVersionName = npmRegistryData['dist-tags'].latest;
    const latestVersionData = npmRegistryData.versions[latestVersionName];
    return res.send({
      hasTypings: 'types' in latestVersionData,
      latestVersion: latestVersionName,
      description: latestVersionData.description,
      releaseDatesByVersion: npmRegistryData.time,
    });
  } catch (exception) {
    console.error(exception);
    res.status(exception.response.status).send(exception.response.data);
  }
});

module.exports = router;
