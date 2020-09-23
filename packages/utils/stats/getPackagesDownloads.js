const _compact = require('lodash/compact');
const _partition = require('lodash/partition');
const isScopedPackageName = require('../isScopedPackageName');
const fetchPackagesStats = require('./fetchPackagesStats');
const standardizeNpmPackageResponse = require('./standardizeNpmPackageResponse');

async function getPackagesDownloads(packageNames, { startDate, endDate }) {
  const [scopedPackageNames, standardPackageNames] = _partition(
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

  const standardPackagesStats = standardizeNpmPackageResponse(
    standardPackagesResponse,
  );
  const scopedPackagesStats = standardizeNpmPackageResponse(
    scopedPackagesResponse,
  );

  const combinedPackagesStats = _compact([
    ...standardPackagesStats,
    ...scopedPackagesStats,
  ]);

  return packageNames.map(packageName =>
    combinedPackagesStats.find(entry => entry.package === packageName),
  );
}

module.exports = getPackagesDownloads;
