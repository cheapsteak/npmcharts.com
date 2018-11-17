const express = require('express');
const proxy = require('http-proxy-middleware');

const router = express.Router();

router.use(
  '/downloads',
  proxy({
    target: 'https://api.npmjs.org',
    changeOrigin: true,
    pathRewrite: { '^/api': '' },
  }),
);

module.exports = router;
