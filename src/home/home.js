import npmData from '../services/downloads.js';
import {graph} from '../graph/graph.js';
// import {removePackage} from '../packages/packages.js';
import config from '../../config.js';

const palette = config.palette;

window.graph = graph;
window.npmData = npmData;

var {default: packageInput, emitter: packageEvents, packages, removePackage} = require('../packages/packages.js');

export default Vue.extend({
  route: {
    waitForData: true,
    data ({ to, next, redirect }) {
      const packageNames = to.path === '/' ? _.sample(this.presetPackages) : to.params.packages && to.params.packages.split(',');

      packageNames
      ? npmData.fetch(packageNames, false)
          .then(() => {
            next({moduleNames: npmData.moduleNames, moduleData: npmData.modules, isPreset: !to.params.packages});
          })
      : next({moduleNames: null, moduleData: null, samplePreset: _.sample(this.presetPackages)});
    },
    activate ({to, next}) {
      if (to.path === '/' || !to.params.packages) {
        document.title = "Compare and graph npm packages";
      } else {
        document.title = "Compare and graph npm packages - " + to.params.packages.split(',').join(', ');
      }
      next();
    }
  },
  template: require('./home.html'),
  data () {
    return {
      presetPackages: config.presetPackages,
      samplePreset: [],
      moduleNames: null,
      moduleData: null,
      palette,
      noWeekends: true,
      isPreset: undefined
    };
  },
  ready () {
    window.hhh = this;
    packageEvents.on('change', () => {
      this.$route.router.go('/compare/' + packages.join(','));
    });
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
      this.$route.router.go('/compare');
    }
  },
  components: {
    'package-input': packageInput,
    graph: require('../graph/graph.js')
  }
});