import _ from 'lodash';
import { isScopedPackageName } from '../isScopedPackageName.js';
import { fetchPackagesStats } from './fetchPackagesStats.js';
import standardizeNpmPackageResponse from './standardizeNpmPackageResponse.js';

export async function getPackagesDownloads(
  packageNames,
  { startDate, endDate },
) {
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

  const standardPackagesStats = standardizeNpmPackageResponse(
    standardPackagesResponse,
  );
  const scopedPackagesStats = standardizeNpmPackageResponse(
    scopedPackagesResponse,
  );

  const combinedPackagesStats = _.compact([
    ...standardPackagesStats,
    ...scopedPackagesStats,
  ]);

  return packageNames.map(packageName =>
    combinedPackagesStats.find(entry => entry.package === packageName),
  );
}
