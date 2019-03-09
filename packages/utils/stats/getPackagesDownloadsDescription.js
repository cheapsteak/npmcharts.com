const _ = require('lodash');
const numeral = require('numeral');
const getPackagesDownloadsComparisons = require('./getPackagesDownloadsComparisons');

const formatDownloadCount = x => numeral(x).format('0,0');
const formatPercentage = x => numeral(x).format('+0.0%');

const getPackagesDescriptions = async packages => {
  let description;

  const comparisons = await getPackagesDownloadsComparisons(packages);
  const trimmedComparisons = _.compact(comparisons);

  if (trimmedComparisons.length === 0) {
    description = `Compare npm package download counts over time to spot trends and see which to use and which to avoid.`;
  } else if (trimmedComparisons.length === 1) {
    const packageStats = trimmedComparisons[0];
    description = `${
      packageStats.package
    } downloads - weekly: ${formatDownloadCount(
      packageStats.weekly.downloads,
    )} (${formatPercentage(
      packageStats.weekly.change,
    )}), monthly: ${formatDownloadCount(
      packageStats.monthly.downloads,
    )} (${formatPercentage(packageStats.monthly.change)})`;
  } else {
    description =
      'Weekly downloads - ' +
      _.orderBy(trimmedComparisons, x => x.weekly.downloads, 'desc')
        .map(
          packageStats =>
            `${packageStats.package}: ${formatDownloadCount(
              packageStats.weekly.downloads,
            )} (${formatPercentage(packageStats.weekly.change)})`,
        )
        .join(', ');
  }

  return description;
};

module.exports = getPackagesDescriptions;
