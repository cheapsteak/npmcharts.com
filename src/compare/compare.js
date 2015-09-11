import npmData from '../services/downloads.js';
import {graph, palette} from './graph/graph.js';
import {removePackage} from '../packages/packages.js';

window.graph = graph;
window.npmData = npmData;

import config from '../config.js';

export default Vue.extend({
  route: {
    waitForData: true,
    data ({ to, next, redirect }) {
      const packageNames = to.params.packages ? to.params.packages.split(',') : _.sample(config.presetPackages);
      npmData.fetch(...packageNames)
        .then(() => {
          console.log('data');
          next({moduleNames: npmData.moduleNames});
          setTimeout(() => graph.render(npmData.modules), 10);
        })
    }
  },
  template: `
    // <legend v-if="moduleNames && palette" bind-modules="moduleNames" bind-palette="palette"></legend>
  `,
  data () {
    return {
      showChart: true,
      moduleNames: null,
      palette
    };
  },
  ready () {
    console.log('compare ready');
  }
});