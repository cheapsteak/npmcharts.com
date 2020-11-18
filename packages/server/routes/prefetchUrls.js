const _partition = require('lodash/partition');
const _flatten = require('lodash/flatten');
const isScopedPackageName = require('utils/isScopedPackageName');
const getPackageRequestPeriods = require('utils/getPackageRequestPeriods');

function getPrefetchUrls(packageNames, start, end) {
  const requestPeriods = getPackageRequestPeriods(start, end);

  // npmjs's api does not support retrieving data of >1 scoped packages (or mix of scoped and unscoped) in one request
  const [scopedPackageNames, standardPackageNames] = _partition(
    packageNames,
    isScopedPackageName,
  );
  const requests = [
    ...scopedPackageNames.map(scopedPackageName => [scopedPackageName]),
    standardPackageNames,
  ];

  return _flatten(
    requests
      .filter(packageNames => {
        return packageNames.length > 0;
      })
      .map(packageNames => {
        return requestPeriods.map(({ startDate, endDate }) => {
          return `https://api.npmjs.org/downloads/range/${startDate}:${endDate}/${packageNames.join(
            ',',
          )}`;
        });
      }),
  );
}

module.exports = getPrefetchUrls;
