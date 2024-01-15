import qs from 'query-string';
import express from 'express';
import debug from 'debug';
import { getChartImage } from 'utils/getChartImage.js';

const router = express.Router();

router.get('/:packages*', async function(req, res, next) {
  debug('chart image route');
  const protocol = req.protocol;
  const host = req.get('host');
  const pathname = req.originalUrl.split('?')[0];

  const packageNames =
    pathname
      .replace(/^\/chart-image\//, '')
      .replace(/\.png/, '')
      .split(',') || [];
  if (!packageNames.length) {
    debug('path doesnt require dynamic screencap');
    // send the fallback image for invalid urls
    res.redirect('https://npmcharts.com/images/og-image-3.png');
  } else {
    try {
      const queryString = qs.stringify(
        Object.assign({}, req.query, { minimal: true }),
      );
      const packagesString = packageNames.join(',');
      const urlToScreencap = `${protocol}://${host}/compare/${packagesString}?${queryString}`;
      debug(`attempting to get chart image for: ${urlToScreencap}`);
      const imageBuffer = await getChartImage(urlToScreencap);
      res.contentType('image/png');
      res.send(imageBuffer);
    } catch (e) {
      debug.error('error generating dynamic image', e);
      res.status(500).send({ error: e.toString() });
    }
  }
});

export const chartImageRouter = router;
