const genericPool = require('generic-pool');
const puppeteer = require('puppeteer');

const factory = {
  create: async function() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    return page;
  },
  destroy: function(puppeteer) {
    puppeteer.close();
  },
};

const browserPool = genericPool.createPool(factory, {
  max: 10,
  min: 2,
  maxWaitingClients: 50,
});

module.exports = browserPool;
