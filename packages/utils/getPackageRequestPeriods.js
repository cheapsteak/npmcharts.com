const { format: formatDate, subDays } = require('date-fns');

const maxRequestPeriod = 365; // ~1 year

function maxDate(a, b) {
  return new Date(Math.max(a.getTime(), b.getTime()));
}

/**
 * @param startDay {number} Start of period, 1 is yesterday
 * @param endDay   {number} End of period 0 is today
 * @returns {Array<{startDate: string, endDate: string}>}
 */
function getPackageRequestPeriods(startDay, endDay) {
  let requestPeriod;
  let requestEndDay = 1;

  const startStats = new Date(Date.UTC(2015, 1, 10));
  let startDate;
  let endDate;

  const periods = [];

  while (requestEndDay > 0) {
    requestPeriod = Math.min(maxRequestPeriod, startDay - endDay);
    requestEndDay = startDay - requestPeriod;

    startDate = maxDate(startStats, subDays(new Date(), startDay));
    endDate = maxDate(startStats, subDays(new Date(), requestEndDay));

    const period = {
      startDate: formatDate(startDate, 'YYYY-MM-DD', null, 'UTC'),
      endDate: formatDate(endDate, 'YYYY-MM-DD', null, 'UTC'),
    };
    periods.push(period);

    startDay = startDay - requestPeriod - 1;
  }

  return periods;
}
module.exports = getPackageRequestPeriods;
