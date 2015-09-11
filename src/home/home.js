import npmData from '../services/downloads.js';
import {graph} from '../graph/graph.js';
// import {removePackage} from '../packages/packages.js';
import config from '../config.js';

const palette = config.palette;

window.graph = graph;
window.npmData = npmData;

var {default: packageInput, packages, removePackage} = require('../packages/packages.js');

export default Vue.extend({
  route: {
    waitForData: true,
    data ({ to, next, redirect }) {
      const packageNames = to.params.packages ? to.params.packages.split(',') : _.sample(config.presetPackages);
      npmData.fetch(...packageNames)
        .then(() => {
          next({moduleNames: npmData.moduleNames, moduleData: npmData.modules});
        })
    }
  },
  data () {
    return {
      moduleNames: null,
      moduleData: null,
      palette
    };
  },
  ready () {
    window.hhh = this;
    // graph.init();
  },
  template: `
    <main>
      <div class="side-panel">
        <package-input bind-on-submit="addPackage"></package-input>
        <button on-click="clearPackages">clear</button>
      </div>
      <graph class="chart" v-if="moduleNames" bind-module-names="moduleNames" bind-module-data="moduleData">
        <legend slot="legend" v-if="moduleNames && palette" bind-modules="moduleNames" bind-palette="palette"></legend>
      </graph>
    </main>
    `,
    components: {
      'package-input': packageInput,
      graph: require('../graph/graph.js'),
      legend: require('../legend/legend.js')
    },
    methods: {
      addPackage (packageName) {
        if (this.$route.params && this.$route.params.packages) {
          this.$route.router.go('/compare/' + this.$route.params.packages + ',' + packageName);
        } else {
          this.$route.router.go('/compare/' + packageName);
        }
      },
      clearPackages () {
        this.$route.router.go('/compare/');
      }
    }
});