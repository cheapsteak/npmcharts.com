const _ = require('lodash');
const { format: formatDate, subDays } = require('date-fns');

const getPackagesDownloads = require('./getPackagesDownloads');

const DATE_FORMAT = 'YYYY-MM-DD';

const getDownloadComparisonForPeriod = (downloads, intervalInDays) => {
  const trimmedDownloads =
    _.last(downloads).downloads === 0 ? _.initial(downloads) : downloads;

  const currentPeriodDownloads = _.sumBy(
    trimmedDownloads.slice(-intervalInDays),
    x => x.downloads,
  );
  const previousPeriodDownloads = _.sumBy(
    _.difference(
      trimmedDownloads.slice(-intervalInDays * 2),
      trimmedDownloads.slice(-intervalInDays),
    ),
    x => x.downloads,
  );
  const change =
    (currentPeriodDownloads - previousPeriodDownloads) /
    previousPeriodDownloads;
  return { downloads: currentPeriodDownloads, change };
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
          package: packageStats.package,
          monthly: getDownloadComparisonForPeriod(packageStats.downloads, 30),
          weekly: getDownloadComparisonForPeriod(packageStats.downloads, 7),
        }
      : null;
  });

  return results;
};

module.exports = getPackagesDownloadsComparisons;
