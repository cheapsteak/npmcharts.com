import debug from 'debug';
import getPackagesFromUrl from './getPackagesFromUrl.js';
import _ from 'lodash';
import sharp from 'sharp';
import url from 'url';
import querystring from 'querystring';
import { getPackagesDownloadsOverPeriod } from './getPackagesDownloadsOverPeriod.js';
import { processPackagesStats } from './processPackagesStats.js';
import { aggregateByInterval } from './aggregateByInterval.js';
import { timeParse } from 'd3-time-format';
import { scaleUtc, scaleLinear } from 'd3-scale';
import { curveCatmullRom, line } from 'd3-shape';

const dateParser = timeParse('%Y-%m-%d');

export const getChartImage = async urlString => {
  try {
    const packageNames = getPackagesFromUrl(urlString);
    const parsedUrl = url.parse(urlString);
    const queryParams = querystring.parse(parsedUrl.query);

    const startDaysOffset = queryParams.start ? Number(queryParams.start) : 365;
    const endDaysOffset = queryParams.end ? Number(queryParams.end) : 0;

    const packageDownloadStats = await getPackagesDownloadsOverPeriod({
      packageNames,
      startDaysOffset,
      endDaysOffset,
    });

    const processedData = processPackagesStats(packageDownloadStats).map(
      ({ name, entries }) =>
        aggregateByInterval(entries, {
          interval: 7,
        }),
    );

    const allDates = packageDownloadStats.flatMap(({ downloads }) =>
      downloads.map(({ day }) => dateParser(day)),
    );
    const allDownloads = processedData.flatMap(packageDownloads =>
      packageDownloads.map(({ count }) => count),
    );

    const x = scaleUtc([_.min(allDates), _.max(allDates)], [0, 500]);
    const y = scaleLinear([_.max(allDownloads), 0], [0, 200]);

    console.log('packageDownloadStats', packageDownloadStats);

    debug('getChartImage', packageNames);
    const svg = `
    <svg
      width="500"
      height="200"
    >
      <rect x="0" y="0" width="200" height="200" rx="50" ry="50"/>
      ${processedData.map(
        packageStats =>
          `<path fill="none" stroke="blue" d="${line()
            .x(d => x(d.day))
            .y(d => y(d.count))
            .curve(curveCatmullRom.alpha(0.5))(
            packageStats
              // the first entry is at 0,0 for some reason
              .slice(1),
          )}"></path>`,
      )}
    </svg>`;

    return sharp(new Buffer(svg))
      .resize(800, 420)
      .png()
      .toBuffer();

    // debug('acquiring page');
    // const page = await browserPagePool.acquire();

    // const navigationCommand = `router.push('/compare/${packages.join(
    //   ',',
    // )}?${qs.stringify(qs.parseUrl(url).query)}')`;
    // debug('evaluating:', navigationCommand);

    // await page.evaluate(navigationCommand);
    // debug(
    //   `waiting for graph to render ('window.__currently_rendered_graph__' to equal '${packages.join(
    //     ',',
    //   )}')`,
    // );
    // try {
    //   await page.waitForFunction(
    //     `window.__currently_rendered_graph__ === '${packages.join(',')}'`,
    //   );
    //   // XXX: found the following line on the server, can't remember why it was added
    //   // commenting out. if og image starts misbehaving then should uncomment it and investigate
    //   // await new Promise(resolve => setTimeout(resolve, 100));
    // } catch (e) {
    //   debug(
    //     'exception while waiting for currently rendered graph, possibly timed out',
    //   );
    //   debug(e);
    //   debug(
    //     'window.__currently_rendered_graph__ is ' +
    //       (await page.evaluate(() => window.__currently_rendered_graph__)),
    //   );
    // }
    // await page.waitFor(300);

    // debug(`taking screenshot`);
    // const screenshot = await page.screenshot();
    // debug('releasing page');
    // await browserPagePool.release(page);
    // debug('returning screenshot');
    // return screenshot;
  } catch (e) {
    console.error('Error getting chart image', e);
    throw e;
  }
};
