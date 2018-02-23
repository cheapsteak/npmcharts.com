const browserPagePool = require('../services/browserPagePool');

module.exports = async url => {
  const page = await browserPagePool.acquire();
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.setViewport({ width: 800, height: 420 });
  const screenshot = await page.screenshot();
  await browserPagePool.release(page);
  return screenshot;
};
