import _ from 'lodash';
import npmData from '../services/downloads.js';
import {graph} from '../graph/graph.js';
import config from '../../config.js';

const palette = config.palette;

var {default: packageInput, emitter: packageEvents, packages, removePackage} = require('../packages/packages.js');

export default Vue.extend({
  route: {
    waitForData: true,
    data ({ to, next, redirect }) {
      const packageNames = to.path === '/' ? _.sample(this.presetPackages) : to.params.packages && to.params.packages.split(',');

      if (to.path === '/' || !to.params.packages) {
        document.title = "npmcharts - compare and graph npm packages";
      } else {
        document.title = "npmcharts - compare and graph npm packages - " + to.params.packages.split(',').join(', ');
      }

      ga('send', 'pageview');

      packageNames
      ? npmData.fetch(packageNames, false)
          .then(() => {
            const moduleData = npmData.modules.map(x => ({
              ...x,
              // if most recent day has no download count, remove it
              downloads: _.last(x.downloads).count === 0 ? _.initial(x.downloads) : x.downloads,
            }))
            next({moduleNames: npmData.moduleNames, moduleData, isPreset: !to.params.packages});
          })
      : next({moduleNames: null, moduleData: null, samplePreset: _.sample(this.presetPackages)});
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
      showWeekends: false,
      showOutliers: true,
      isPreset: undefined,
      hoverCount: 0,
      twitterIcon: require('../assets/images/icon-twitter.svg'),
    };
  },
  computed: {
    shareUrl () {
      return this.moduleNames && `http://npmcharts.com/compare/${this.moduleNames.join(',')}`;
    },
    twitterShareUrl () {
      return this.shareUrl && `https://twitter.com/intent/tweet?url=${window.encodeURIComponent(this.shareUrl)}`;
    },
    twitterMessage () {
      const hoverCount = this.hoverCount;
      return hoverCount < 3
        ? 'this chart'
        : hoverCount < 6
          ? 'neat eh?'
          : hoverCount < 10
            ? 'do iiiit'
            : 'just click it already!'
    }
  },
  ready () {
    packageEvents.on('change', () => {
      this.$route.router.go('/compare/' + packages.join(','));
    });
  },
  methods: {
    addPackage (packageName) {
      ga('send', 'event', 'packageInput', 'add', packageName);
      if (this.$route.params && this.$route.params.packages) {
        this.$route.router.go('/compare/' + this.$route.params.packages + ',' + packageName);
      } else {
        this.$route.router.go('/compare/' + packageName);
      }
    },
    clearPackages () {
      this.$route.router.go('/compare');
    },
    handleClickTwitter () {
      ga('send', 'event', 'share', 'twitter', this.twitterShareUrl);
      window.open(this.twitterShareUrl);
    },
    handleHoverTwitter () {
      this.hoverCount++;
      ga('send', 'event', 'hoverShare', 'twitter', this.twitterShareUrl, this.hoverCount);
      
    },
    handleMouseEnterTwitter () {
      this.twitterEventTimeout = setTimeout(this.handleHoverTwitter, 500)
    },
    handleMouseLeaveTwitter () {
      clearTimeout(this.twitterEventTimeout);
    },
    shuffle: _.shuffle,
  },
  components: {
    'package-input': packageInput,
    graph: require('../graph/graph.js')
  }
});