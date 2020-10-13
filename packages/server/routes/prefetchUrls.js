const _partition = require('lodash/partition');
const isScopedPackageName = require('utils/isScopedPackageName');
const getPackageRequestPeriods = require('utils/getPackageRequestPeriods');

function getPrefetchUrls(packageNames, start, end) {
  const requestPeriods = getPackageRequestPeriods(start, end);

  // Need to partition into two because npmjs's api does not support retrieving data of scoped and unscoped packages in one request
  const partitionedPackageNames = _partition(packageNames, isScopedPackageName);

  return partitionedPackageNames
    .map(packageNames => {
      return requestPeriods.map(({ startDate, endDate }) => {
        return `https://api.npmjs.org/downloads/range/${startDate}:${endDate}/${packageNames.join(
          ',',
        )}`;
      });
    })
    .flat();
}

module.exports = getPrefetchUrls;
