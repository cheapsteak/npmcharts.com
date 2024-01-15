import { Router } from 'express';
import vhost from 'vhost';
import debugBase from 'debug';
import * as url from 'url';
import * as querystring from 'querystring';

import { getTitle } from 'utils/getTitle.js';
import { getMinimalUrl } from 'utils/getMinimalUrl.js';
import shouldScreencapUrl from 'utils/shouldScreencapUrl.js';
import { getPackagesDownloadsDescriptions } from 'utils/stats/getPackagesDownloadsDescription.js';
import { getPackagesFromUrl } from 'utils/getPackagesFromUrl.js';
import getPrefetchUrls from './prefetchUrls.js';

import { routeSubdomains } from './routeSubdomains.js';

const router = Router();
const debug = debugBase('server:server');

// req.protocol is returning 'http' when it shouldn't
const protocol = 'https';

const sendSPA = async function(req, res, next) {
  debug('sendSPA: is prod node env?', process.env.NODE_ENV);
  const packages = getPackagesFromUrl(req.originalUrl);
  const fullUrl = url.parse(
    protocol + '://' + req.get('host') + req.originalUrl,
  );
  const minimalModeUrl = getMinimalUrl(fullUrl.href);
  const ogImage = shouldScreencapUrl(minimalModeUrl)
    ? `${protocol}://${req.get('host')}/chart-image/${packages.join(',')}.png${
        fullUrl.search ? fullUrl.search : ''
      }`
    : 'https://npmcharts.com/images/og-image-3.png';

  const startDate = req.query.start ? req.query.start : 365;
  const endDate = req.query.end ? req.query.end : 0;
  const prefetchUrls = getPrefetchUrls(packages, startDate, endDate);

  const pageDescription = await getPackagesDownloadsDescriptions(packages);

  res.render('index', {
    title: getTitle(packages),
    description: pageDescription,
    oembedUrl: `https://npmcharts.com/oembed?${querystring.stringify({
      url: fullUrl.href,
      format: 'json',
    })}`,
    ogImage,
    prefetchUrls,
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
router.use(vhost('*.deploys.npmcharts.com', routeSubdomains));

export default router;
