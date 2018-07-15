const url = require('url');
const querystring = require('querystring');
const express = require('express');
const router = express.Router();

const getTitle = require('utils/getTitle');
const getMinimalUrl = require('utils/getMinimalUrl');
const shouldScreencapUrl = require('utils/shouldScreencapUrl');
const getPackagesDownloadsDescriptions = require('utils/stats/getPackagesDownloadsDescription');
const getPackgesFromUrl = require('utils/getPackagesFromUrl');

const sendSPA = async function(req, res, next) {
  const packages = getPackgesFromUrl(req.originalUrl);
  const fullUrl = url.parse(
    req.protocol + '://' + req.get('host') + req.originalUrl,
  );
  const minimalModeUrl = getMinimalUrl(fullUrl.href);
  const ogImage = shouldScreencapUrl(minimalModeUrl)
    ? `${req.protocol}://${req.get('host')}/chart-image?${querystring.stringify(
        {
          url: fullUrl.href,
        },
      )}`
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
  });
};

/* GET home page. */
router.get('/', sendSPA);
router.get('/compare/:packages*', sendSPA);

router.get('//compare/:packages*', (req, res) =>
  res.redirect(
    301,
    url.parse(
      req.protocol +
        '://' +
        req.get('host') +
        req.originalUrl.replace(/\/\/compare/, '/compare'),
    ).href,
  ),
);

module.exports = router;
