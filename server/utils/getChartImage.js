var debug = require('debug')('server:getChartImage');
const browserPagePool = require('../services/browserPagePool');

module.exports = async url => {
  try {
    debug('acquiring page');
    const page = await browserPagePool.acquire();
    debug('going to' + url);
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
    debug('setting viewport');
    await page.setViewport({ width: 800, height: 420 });
    debug('taking screenshot');
    const screenshot = await page.screenshot();
    debug('releasing page');
    await browserPagePool.release(page);
    debug('returning screenshot');
    return screenshot;
  } catch (e) {
    console.error('Error getting chart image', e);
  }
};
