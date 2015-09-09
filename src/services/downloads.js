import _ from 'lodash';
import moment from 'moment';

const DATE_FORMAT = 'YYYY-MM-DD';
const packages = ['jade', 'jquery'];
const end = moment().format(DATE_FORMAT);
const start = moment().subtract(1, 'year').format('YYYY-MM-DD');

function allow(entry) {
  const conditions = [
    // not a weekend
    [0, 6].indexOf(entry.day.getDay()) === -1,
  ];
  return _.every(conditions);
}

function processDownloads(json) {
  return [for (module of (json.package ? [json] : _.values(json)))
    {
      name: module.package,
      // replace '-' with '/' to fix problem with ES5 coercing it to UTC
      downloads: [
        for (entry of module.downloads)
        {day: new Date(entry.day.replace(/\-/g, '/')), count: entry.downloads}
      ]
    }];
}

async function fetchPackages(...packages) {
  const url = `https://api.npmjs.org/downloads/range/${start}:${end}/${packages.join()}`
  const response = await fetch(url);
  const json = await response.json();
  return processDownloads(json);
}

export default (function () {
  let modules = {};
  let moduleNames = []; // so that ordering will be based on argument order in fetch

  return {
    get modules() {
      return [for (module of _.values(_.pick(modules, moduleNames))) {
        name: module.name,
        downloads: [
          for (entry of module.downloads)
          if (allow(entry))
          entry
        ]
      }];
    },
    async fetch(...packages) {
      moduleNames = packages;
      const newData = await fetchPackages(...packages);
      _.forEach(newData, module => {
        modules[module.name] = _.extend({}, modules[module.name], module);
      });
      return this.modules;
    }
  };
})();