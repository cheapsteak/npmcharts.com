import _ from 'lodash';
import moment from 'moment';

import {packages, setPackages} from '../packages/packages.js'
import isScopedPackageName from 'is-scoped';

export default (function () {
  const DATE_FORMAT = 'YYYY-MM-DD';
  const end = moment().format(DATE_FORMAT);
  const start = moment().subtract(1, 'year').format('YYYY-MM-DD');

  function processDownloads(json) {
    const modules = (json.package ? [json] : _.values(json))
      .filter(_.isObject);
    return modules.map((module) => ({
        name: module.package,
        // replace '-' with '/' to fix problem with ES5 coercing it to UTC
        downloads: module.downloads
          .map(entry => ({day: new Date(entry.day.replace(/\-/g, '/')), count: entry.downloads}))
      }));
  }

  async function fetchPackages(...packageNames) {
    const url = `https://api.npmjs.org/downloads/range/${start}:${end}/${packageNames.join()}`;
    const response = await fetch(url);
    const json = await response.json();
    return processDownloads(json);
  }

  async function batchFetchPackages(...packageNames) {
    const { scopedPackageNames, globalPackageNames } = _.groupBy(packageNames, name => isScopedPackageName(name) ? 'scopedPackageNames' : 'globalPackageNames');
    const [ scopedPackageStats, globalPackageStats ] = [
      await (scopedPackageNames && Promise.all(scopedPackageNames.map((packageName) => fetchPackages(packageName)))),
      await (globalPackageNames && fetchPackages(...globalPackageNames))
    ];
    return _.flatten(_.compact(_.concat(scopedPackageStats, globalPackageStats)));
  }

  let modules = {};

  return {
    get modules() {
      return [for (module of _.values(_.pick(modules, packages))) {
        name: module.name,
        downloads: [
          for (entry of module.downloads)
          entry
        ]
      }];
    },
    get moduleNames () {
      return packages;
    },
    async fetch(packages, notify=true) {
      setPackages(packages, notify);

      const newData = await batchFetchPackages(...packages);
      _.forEach(newData, module => {
        modules[module.name] = _.extend({}, modules[module.name], module);
      });
      return this.modules;
    }
  };
})();