const _ = require('lodash');
const fetch = require('isomorphic-fetch');
const isScopedPackageName = require('../utils/isScopedPackageName');

const standardizePackageResponse = response =>
  'package' in response ? [response] : Object.values(response);

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
  const standardPackagesRequest = standardPackageNames.length
    ? fetchPackagesStats(standardPackageNames)
    : {};

  const [
    standardPackagesResponse,
    ...scopedPackagesResponse
  ] = await Promise.all([standardPackagesRequest, ...scopedPackagesRequests]);

  const standardPackagesStats = standardizePackageResponse(
    standardPackagesResponse,
  );
  const scopedPackagesStats = standardizePackageResponse(
    scopedPackagesResponse,
  );

  return _.sortBy(
    [...standardPackagesStats, ...scopedPackagesStats],
    packageName => packageNames.indexOf(packageName.package),
  );
}

export default getPackageStats;
