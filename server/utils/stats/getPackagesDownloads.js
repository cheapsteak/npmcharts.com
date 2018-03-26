const _ = require('lodash');
const fetch = require('isomorphic-fetch');
const isScopedPackageName = require('../isScopedPackageName');

const standardizePackageResponse = response =>
  'package' in response ? [response] : Object.values(response);

async function getPackagesDownloads(packageNames, { startDate, endDate }) {
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

  const combinedPackagesStats = _.compact([
    ...standardPackagesStats,
    ...scopedPackagesStats,
  ]);

  return packageNames.map(packageName =>
    _.find(combinedPackagesStats, entry => entry.package === packageName),
  );
}

module.exports = getPackagesDownloads;
