var debug = require('debug')('server:browserPagePool');
const genericPool = require('generic-pool');
const puppeteer = require('puppeteer');

const factory = {
  create: async function() {
    try {
      debug('launching browser');
      const browser = await puppeteer.launch();
      debug('opening new page');
      const page = await browser.newPage();
      debug('returning page');
      return page;
    } catch (e) {
      console.error('browserPagePool error cretaing browser page', e);
    }
  },
  destroy: function(puppeteer) {
    debug('closing browser');
    puppeteer.close();
  },
};

const browserPool = genericPool.createPool(factory, {
  max: 10,
  min: 2,
  maxWaitingClients: 50,
});

module.exports = browserPool;
