const url = require('url');
const querystring = require('querystring');
const express = require('express');
const vhost = require('vhost');
const router = express.Router();
const debug = require('debug')('server:server');

const getTitle = require('utils/getTitle');
const getMinimalUrl = require('utils/getMinimalUrl');
const shouldScreencapUrl = require('utils/shouldScreencapUrl');
const getPackagesDownloadsDescriptions = require('utils/stats/getPackagesDownloadsDescription');
const getPackgesFromUrl = require('utils/getPackagesFromUrl');

// req.protocol is returning 'http' when it shouldn't
const protocol = 'https';

const sendSPA = async function(req, res, next) {
  debug('sendSPA: is prod node env?', process.env.NODE_ENV);
  const packages = getPackgesFromUrl(req.originalUrl);
  const fullUrl = url.parse(
    protocol + '://' + req.get('host') + req.originalUrl,
  );
  const minimalModeUrl = getMinimalUrl(fullUrl.href);
  const ogImage = shouldScreencapUrl(minimalModeUrl)
    ? `${protocol}://${req.get('host')}/chart-image/${packages.join(',')}.png${
        fullUrl.search ? fullUrl.search : ''
      }`
    : 'https://npmcharts.com/images/og-image-3.png';
  const pageDescription = await getPackagesDownloadsDescriptions(packages);

  res.render('index', {
    title: getTitle(packages),
    description: pageDescription,
    oembedUrl: `https://npmcharts.com/oembed?${querystring.stringify({
      url: fullUrl.href,
      format: 'json',
    })}`,
    ogImage,
    isEmbed: !!req.query.minimal,
    canonicalUrl: `https://npmcharts.com${fullUrl.pathname}`,
    jsBundleSrc:
      process.env.NODE_ENV !== 'production'
        ? '/static/app.bundle.js'
        : // : 'https://npmcharts.storage.googleapis.com/deployments/branches/master/public/static/app.bundle.js',
          'https://npmcharts.netlify.app/static/app.bundle.js',
    cssBundleSrc:
      process.env.NODE_ENV !== 'production'
        ? '/app.css'
        : // : 'https://npmcharts.storage.googleapis.com/deployments/branches/master/public/app.css',
          'https://npmcharts.netlify.app/app.css',
  });
};

/* GET home page. */
router.get('/', sendSPA);
router.get('/compare/:packages*', sendSPA);

router.get('//compare/:packages*', (req, res) =>
  res.redirect(
    301,
    url.parse(
      protocol +
        '://' +
        req.get('host') +
        req.originalUrl.replace(/\/\/compare/, '/compare'),
    ).href,
  ),
);

router.use(
  vhost(
    '*.deploys.npmcharts.com',
    require('./routeSubdomains').routeSubdomains,
  ),
);

module.exports = router;
