import _ from 'lodash/fp';
import { format as formatDate, startOfDay } from 'date-fns';

export const processPackagesStats = (
  packagesDownloadStats,
  packagesVersionsDates,
) => {
  return packagesDownloadStats.flatMap(singlePackageDownloadStats => {
    const packageName = singlePackageDownloadStats.package;
    if (!singlePackageDownloadStats) return [];
    const entries = singlePackageDownloadStats.downloads.map(npmModuleData => {
      const day = startOfDay(npmModuleData.day);
      return {
        day,
        count: npmModuleData.downloads,
        releases:
          packagesVersionsDates?.[packageName]?.[
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
