import _ from 'lodash';
import isScopedPackageName from 'utils/isScopedPackageName.js';
import getPackageRequestPeriods from 'utils/getPackageRequestPeriods.js';

function getPrefetchUrls(packageNames, start, end) {
  const requestPeriods = getPackageRequestPeriods(start, end);

  // npmjs's api does not support retrieving data of >1 scoped packages (or mix of scoped and unscoped) in one request
  const [scopedPackageNames, standardPackageNames] = _.partition(
    packageNames,
    isScopedPackageName,
  );
  const requests = [
    ...scopedPackageNames.map(scopedPackageName => [scopedPackageName]),
    standardPackageNames,
  ];

  return _.flatten(
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

export default getPrefetchUrls;
