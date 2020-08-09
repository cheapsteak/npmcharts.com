const debug = require('debug')('server:getChartImage');
const browserPagePool = require('./services/browserPagePool');
const getPackagesFromUrl = require('./getPackagesFromUrl');

module.exports = async url => {
  try {
    debug('checking if screenshot exists');

    const packages = getPackagesFromUrl(url);

    debug('acquiring page');
    const page = await browserPagePool.acquire();

    const navigationCommand = `router.push('/compare/${packages.join(
      ',',
    )}?minimal=true')`;
    debug('evaluating:', navigationCommand);

    await page.evaluate(navigationCommand);
    debug(
      `waiting for graph to render ('window.__currently_rendered_graph__' to equal '${packages.join(
        ',',
      )}')`,
    );
    try {
      await page.waitForFunction(
        `window.__currently_rendered_graph__ === '${packages.join(',')}'`,
      );
      // XXX: found the following line on the server, can't remember why it was added
      // commenting out. if og image starts misbehaving then should uncomment it and investigate
      // await new Promise(resolve => setTimeout(resolve, 100));
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

    debug(`taking screenshot`);
    const screenshot = await page.screenshot();
    debug('releasing page');
    await browserPagePool.release(page);
    debug('returning screenshot');
    return screenshot;
  } catch (e) {
    console.error('Error getting chart image', e);
  }
};
