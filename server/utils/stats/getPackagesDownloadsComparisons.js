const _ = require('lodash');
const { format: formatDate, subDays } = require('date-fns');

const getPackagesDownloads = require('./getPackagesDownloads');

const DATE_FORMAT = 'YYYY-MM-DD';

const getDownloadComparisonForPeriod = (downloads, durationInDays) => {
  const trimmedDownloads =
    _.last(downloads).downloads === 0 ? _.initial(downloads) : downloads;

  const current = _.sumBy(
    trimmedDownloads.slice(-durationInDays),
    x => x.downloads,
  );
  const previous = _.sumBy(
    _.difference(
      trimmedDownloads.slice(-durationInDays * 2),
      trimmedDownloads.slice(-durationInDays),
    ),
    x => x.downloads,
  );
  const change = (current - previous) / previous;
  return { current, previous, change };
};

const getPackagesDownloadsComparisons = async packageNames => {
  const [startDate, now] = [
    formatDate(subDays(new Date(), 61), DATE_FORMAT),
    formatDate(new Date(), DATE_FORMAT),
  ];

  const packagesStats = await getPackagesDownloads(packageNames, {
    startDate,
    endDate: now,
  });

  const results = packagesStats.map(packageStats => {
    return packageStats
      ? {
          monthly: getDownloadComparisonForPeriod(packageStats.downloads, 30),
          weekly: getDownloadComparisonForPeriod(packageStats.downloads, 7),
        }
      : null;
  });

  return results;
};

module.exports = getPackagesDownloadsComparisons;
