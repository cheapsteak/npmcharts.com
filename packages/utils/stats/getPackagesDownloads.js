const _ = require('lodash');
const isScopedPackageName = require('../isScopedPackageName');
const fetchPackagesStats = require('./fetchPackagesStats');

const standardizePackageResponse = response =>
  'package' in response ? [response] : Object.values(response);

async function getPackagesDownloads(packageNames, { startDate, endDate }) {
  const [scopedPackageNames, standardPackageNames] = _.partition(
    packageNames,
    isScopedPackageName,
  );

  const scopedPackagesRequests = scopedPackageNames.map(packageName =>
    fetchPackagesStats([packageName], startDate, endDate),
  );

  const standardPackagesRequest = standardPackageNames.length
    ? fetchPackagesStats(standardPackageNames, startDate, endDate)
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
