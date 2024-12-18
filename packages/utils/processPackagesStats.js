const _ = require('lodash');
const { format: formatDate, startOfDay } = require('date-fns');

export const processPackagesStats = (
  packagesDownloadStats,
  npmMetadataByPackageName,
) => {
  return packagesDownloadStats.flatMap(singlePackageDownloadStats => {
    if (!singlePackageDownloadStats) return [];
    const packageName = singlePackageDownloadStats.package;
    const entries = singlePackageDownloadStats.downloads.map(npmModuleData => {
      const day = startOfDay(npmModuleData.day);
      return {
        day,
        count: npmModuleData.downloads,
        releases:
          npmMetadataByPackageName?.[packageName]?.releaseDates[
            formatDate(day, 'YYYY-MM-DD', null, 'UTC')
          ] || [],
      };
    });
    return [
      {
        name: packageName,
        // if most recent day has no download count, remove it
        entries: _.last(entries).count === 0 ? _.initial(entries) : entries,
      },
    ];
  });
};
