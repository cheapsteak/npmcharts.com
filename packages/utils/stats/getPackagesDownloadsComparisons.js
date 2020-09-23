const _last = require('lodash/last');
const _sumBy = require('lodash/sumBy');
const _initial = require('lodash/initial');
const _difference = require('lodash/difference');
const { format: formatDate, subDays } = require('date-fns');

const getPackagesDownloads = require('./getPackagesDownloads');

const DATE_FORMAT = 'YYYY-MM-DD';

const getDownloadComparisonForPeriod = (downloads, intervalInDays) => {
  const trimmedDownloads =
    _last(downloads).downloads === 0 ? _initial(downloads) : downloads;

  const currentPeriodDownloads = _sumBy(
    trimmedDownloads.slice(-intervalInDays),
    x => x.downloads,
  );
  const previousPeriodDownloads = _sumBy(
    _difference(
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
