const puppeteer = require('puppeteer');

module.exports = async url => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.setViewport({ width: 800, height: 420 });
  const screenshot = await page.screenshot();
  await browser.close();
  return screenshot;
};
