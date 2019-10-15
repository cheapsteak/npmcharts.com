const path = require('path');
const fs = require('fs-extra');
const debug = require('debug')('server:getChartImage');
const differenceInWeeks = require('date-fns/difference_in_weeks');
const sanitizeFilename = require('filenamify');

const browserPagePool = require('./services/browserPagePool');
const getPackagesFromUrl = require('./getPackagesFromUrl');
const SCREENSHOT_DIR = require('configs/SCREENSHOT_DIR');

const sanitizeScreenshotFilename = url =>
  sanitizeFilename(getPackagesFromUrl(url).join(','));

const fileIsNotStale = filePath =>
  differenceInWeeks(new Date(), Date(fs.statSync(filePath).mtime)) < 2;

module.exports = async url => {
  try {
    debug('checking if screenshot exists');
    const screenshotPath = path.join(
      SCREENSHOT_DIR,
      `${sanitizeScreenshotFilename(url)}.png`,
    );

    if (fs.existsSync(screenshotPath) && fileIsNotStale(screenshotPath)) {
      debug('returning existing screenshot');
      return fs.readFileSync(screenshotPath);
    }

    const packages = getPackagesFromUrl(url);

    debug('acquiring page');
    const page = await browserPagePool.acquire();

    const navigationCommand = `router.push('/compare/${packages.join(
      ',',
    )}?minimal=true')`;
    debug('evaluating:', navigationCommand);

    await page.evaluate(navigationCommand);
    debug('waiting for graph to render');
    try {
      await page.waitForFunction(
        `window.__currently_rendered_graph__ === '${packages.join(',')}';`,
      );
    } catch (e) {
      debug(
        'exception while waiting for currently rendered graph, possibly timed out',
      );
      debug(e);
      debug(
        'window.__currently_rendered_graph__ is ' +
          (await page.evaluate(() => window.__currently_rendered_graph__)),
      );
    }
    await page.waitFor(300);

    fs.ensureDirSync(SCREENSHOT_DIR);
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
