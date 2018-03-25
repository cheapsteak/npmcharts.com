const _ = require('lodash');
const isScopedPackageName = require('../utils/isScopedPackageName');

function fetchPackagesStats(packageNames, { startDate, endDate }) {
  const packageNamesParam = packageNames.join(',');
  const url = `https://api.npmjs.org/downloads/range/${startDate}:${endDate}/${packageNamesParam}`;
  return fetch(url).then(response => response.json());
}

async function getPackageStats(packageNames, { startDate, endDate }) {
  const fetchOptions = { startDate, endDate };
  const [scopedPackageNames, standardPackageNames] = _.partition(
    packageNames,
    isScopedPackageName,
  );

  const scopedPackagesRequests = scopedPackageNames.map(packageName =>
    fetchPackagesStats([packageName], fetchOptions),
  );
  const standardPackagesRequest = fetchPackagesStats(
    standardPackageNames,
    fetchOptions,
  );

  const [
    standardPackagesResponse,
    ...scopedPackagesResponse
  ] = await Promise.all([standardPackagesRequest, ...scopedPackagesRequests]);

  const standardPackagesStats =
    'package' in standardPackagesResponse
      ? [standardPackagesResponse]
      : Object.values(standardPackagesResponse);
  return [...standardPackagesStats, ...scopedPackagesResponse];
}

export default getPackageStats;
