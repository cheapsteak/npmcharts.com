const path = require('path');
const fs = require('fs-extra');
const debug = require('debug')('server:getChartImage');
const differenceInWeeks = require('date-fns/difference_in_weeks');
const sanitizeFilename = require('filenamify');
const browserPagePool = require('../services/browserPagePool');
const getPackagesFromUrl = require('./getPackagesFromUrl');

const sanitizeScreenshotFilename = url =>
  sanitizeFilename(getPackagesFromUrl(url).join(','));

const fileIsNotStale = filePath =>
  differenceInWeeks(new Date(), Date(fs.statSync(filePath).mtime)) < 3;

module.exports = async url => {
  try {
    debug('checking if screenshot exists');
    const screenshotDir = path.join(__dirname, '../../screenshots/');
    const screenshotPath = path.join(
      screenshotDir,
      `${sanitizeScreenshotFilename(url)}.png`,
    );

    if (fs.existsSync(screenshotPath) && fileIsNotStale(screenshotPath)) {
      debug('returning existing screenshot');
      return fs.readFileSync(screenshotPath);
    }

    debug('acquiring page');
    const page = await browserPagePool.acquire();
    debug('going to' + url);
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
    debug('setting viewport');
    await page.setViewport({ width: 800, height: 420 });
    fs.ensureDirSync(screenshotDir);
    debug('taking screenshot');
    const screenshot = await page.screenshot({
      path: screenshotPath,
    });
    debug('releasing page');
    await browserPagePool.release(page);
    debug('returning screenshot');
    return screenshot;
  } catch (e) {
    console.error('Error getting chart image', e);
  }
};
