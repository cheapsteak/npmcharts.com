const _ = require('lodash');
const isScopedPackageName = require('../utils/isScopedPackageName');

async function getPackageStats(packageNames, { startDate, endDate }) {
  function fetchPackagesStats(packageNames) {
    const packageNamesParam = packageNames.join(',');
    const url = `https://api.npmjs.org/downloads/range/${startDate}:${endDate}/${packageNamesParam}`;
    return fetch(url).then(response => response.json());
  }

  const [scopedPackageNames, standardPackageNames] = _.partition(
    packageNames,
    isScopedPackageName,
  );

  const scopedPackagesRequests = scopedPackageNames.map(packageName =>
    fetchPackagesStats([packageName]),
  );
  const standardPackagesRequest = fetchPackagesStats(standardPackageNames);

  const [
    standardPackagesResponse,
    ...scopedPackagesResponse
  ] = await Promise.all([standardPackagesRequest, ...scopedPackagesRequests]);

  const standardPackagesStats =
    'package' in standardPackagesResponse
      ? [standardPackagesResponse]
      : Object.values(standardPackagesResponse);

  return _.sortBy(
    [...standardPackagesStats, ...scopedPackagesResponse],
    packageName => packageNames.indexOf(packageName.package),
  );
}

export default getPackageStats;
