const _ = require('lodash');

export function aggregateByInterval(entries, { interval = 7 }) {
  if (interval !== 1) {
    entries = _.flow([
      entries =>
        _.groupBy(entries, entry =>
          Math.floor((entries.length - entries.indexOf(entry) - 1) / interval),
        ),
      _.values,
      entries =>
        entries.map(entriesInGroup => ({
          count: _.sumBy(entriesInGroup, entry => entry.count),
          day: entriesInGroup[0].day,
          releases: entriesInGroup.flatMap(entry => entry.releases),
        })),
      /*
          x axis entries need to be in ascending order
          finding the point to highlight relies on nv.interactiveBisect
          (used in lineChart.js on "elementMousemove")
          which "Will not work if the data points move backwards
        */
      _.reverse,
    ])(entries);
  }

  return entries;
}
