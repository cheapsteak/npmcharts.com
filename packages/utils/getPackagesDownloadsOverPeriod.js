const getPackageRequestPeriods = require('./getPackageRequestPeriods');
const getPackagesDownloads = require('./stats/getPackagesDownloads');

/**
 * Merge 2 statistic periods
 * @param period0 Period before period1
 * @param period1 Period after period0
 * @returns The merged period
 */
function mergePeriods(period0, period1) {
  const sumPackages = [];

  for (let p = 0; p < period0.length; ++p) {
    sumPackages.push({
      downloads: period0[p].downloads.concat(period1[p].downloads),
      package: period0[p].package,
      start: period0[p].start,
      end: period1[p].end,
    });
  }

  return sumPackages;
}

/**
 * Need to break up over periods because npm has a max of 365 days per request
 * @param packageNames    {string} Package names
 * @param startDay {number} Start of period, 1 is yesterday
 * @param endDay   {number} End of period 0 is today
 * @returns {Promise<any>}
 */
export async function getPackagesDownloadsOverPeriod({
  packageNames,
  startDaysOffset,
  endDaysOffset,
}) {
  const requestPeriods = getPackageRequestPeriods(
    startDaysOffset,
    endDaysOffset,
  );
  const promises = requestPeriods.map(period => {
    return getPackagesDownloads(packageNames, {
      startDate: period.startDate,
      endDate: period.endDate,
    });
  });
  const periods = await Promise.all(promises);
  const mergedPeriod = periods.reduce(
    (mergedPeriodsSoFar, currentPeriod, currentIndex) => {
      if (currentIndex === 0) {
        // Because the first period is used as init
        return mergedPeriodsSoFar;
      }
      return mergePeriods(mergedPeriodsSoFar, currentPeriod);
    },
    periods[0],
  );

  return mergedPeriod;
}
