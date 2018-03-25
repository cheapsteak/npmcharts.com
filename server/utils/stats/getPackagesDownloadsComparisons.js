const _ = require('lodash');
const { format: formatDate, subDays } = require('date-fns');

const getPackagesDownloads = require('./getPackagesDownloads');

const DATE_FORMAT = 'YYYY-MM-DD';

const getPackagesDownloadsComparisons = async packageNames => {
  const [startDate, now] = [
    formatDate(subDays(new Date(), 61), DATE_FORMAT),
    formatDate(new Date(), DATE_FORMAT),
  ];

  const packagesStats = await getPackagesDownloads(packageNames, {
    startDate,
    endDate: now,
  });

  const getDownloadComparisonForPeriod = (downloads, durationInDays) => {
    const current = _.sumBy(downloads.slice(-durationInDays), x => x.downloads);
    const previous = _.sumBy(
      _.difference(
        downloads.slice(-durationInDays * 2),
        downloads.slice(-durationInDays),
      ),
      x => x.downloads,
    );
    const change = (current - previous) / previous;
    return { current, previous, change };
  };

  const results = packagesStats.map(packageStats => {
    const downloads =
      _.last(packageStats.downloads).downloads === 0
        ? _.initial(packageStats.downloads)
        : packageStats.downloads;

    return {
      monthly: getDownloadComparisonForPeriod(downloads, 30),
      weekly: getDownloadComparisonForPeriod(downloads, 7),
    };
  });

  return results;
};

module.exports = getPackagesDownloadsComparisons;
