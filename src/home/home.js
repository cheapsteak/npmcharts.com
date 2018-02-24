import Vue from 'vue';
import querystring from 'querystring';
import _ from 'lodash';
import npmData from '../services/downloads.js';
import config from '../../config.js';

const palette = config.palette;

var {
  default: packageInput,
  emitter: packageEvents,
  packages,
} = require('../packages/packages.js');

export default Vue.extend({
  route: {
    waitForData: true,
    canReuse(...args) {
      // hack to solve https://github.com/cheapsteak/npmcharts.com/issues/23
      // > Dots on graph don't update when a package is added/removed
      return false;
    },
    data({ to, next, redirect }) {
      const packageNames =
        to.path === '/' || !to.params.packages
          ? _.sample(this.presetPackages)
          : to.params.packages
              .split(',')
              .map(packageName => window.decodeURIComponent(packageName));

      if (to.path === '/' || !to.params.packages) {
        document.title = 'Compare download stats for npm packages - npmcharts';
        this.isUsingPresetPackages = true;
      } else {
        document.title =
          'Compare npm downloads for ' +
          to.params.packages.split(',').join(', ') +
          ' - npmcharts';
      }

      setTimeout(() => ga('send', 'pageview'));

      packageNames
        ? npmData.fetch(packageNames, false).then(() => {
            const moduleData = npmData.modules.map(x => ({
              ...x,
              // if most recent day has no download count, remove it
              downloads:
                _.last(x.downloads).count === 0
                  ? _.initial(x.downloads)
                  : x.downloads,
            }));
            next({
              isMinimalMode: to.query.minimal,
              moduleNames: npmData.moduleNames,
              moduleData,
              isUsingPresetPackages: !to.params.packages,
            });
          })
        : next({
            isMinimalMode: to.query.minimal,
            moduleNames: null,
            moduleData: null,
            samplePreset: _.sample(this.presetPackages),
          });
    },
  },
  template: require('./home.html'),
  data() {
    return {
      presetPackages: config.presetPackages,
      samplePreset: [],
      moduleNames: null,
      moduleData: null,
      palette,
      showWeekends: false,
      showOutliers: true,
      isMinimalMode: false,
      isUsingPresetPackages: undefined,
      hoverCount: 0,
      twitterIcon: require('../assets/images/icon-twitter.svg'),
      shouldShowComments:
        window.innerWidth >= 1000 &&
        !JSON.parse(!!window.localStorage.getItem('shouldShowComments')),
    };
  },
  computed: {
    shareUrl() {
      return (
        this.moduleNames &&
        `http://npmcharts.com/compare/${this.moduleNames.join(',')}`
      );
    },
    twitterShareUrl() {
      return (
        this.shareUrl &&
        `https://twitter.com/intent/tweet?url=${window.encodeURIComponent(
          this.shareUrl,
        )}`
      );
    },
    twitterMessage() {
      const hoverCount = this.hoverCount;
      return hoverCount < 3
        ? 'this chart'
        : hoverCount < 6
          ? 'neat eh?'
          : hoverCount < 10 ? 'do iiiit' : 'just click it already!';
    },
    isEmbedded() {
      return this.isMinimalMode;
    },
  },
  watch: {
    shouldShowComments() {
      this.$refs.graph.render();
    },
    isMinimalMode(isMinimalMode) {
      console.log('isminimalmode', isMinimalMode);
      if (isMinimalMode) {
        document.body.classList.add('minimal');
      } else {
        document.body.classList.remove('minimal');
      }
      this.$refs.graph.render();
    },
  },
  ready() {
    packageEvents.on('change', () => {
      const queryString = querystring.stringify(this.$route.query);
      this.$route.router.go(`/compare/${packages.join(',')}?${queryString}`);
    });
  },
  methods: {
    addPackage(packageName) {
      ga(
        'send',
        'event',
        'packageInput',
        'add',
        `${packageName} existing:${this.moduleNames}`,
      );
      if (this.$route.params && this.$route.params.packages) {
        this.$route.router.go(
          '/compare/' + this.$route.params.packages + ',' + packageName,
        );
      } else {
        this.$route.router.go('/compare/' + packageName);
      }
    },
    clearPackages() {
      this.$route.router.go('/compare');
    },
    handleClickToggleComments() {
      const eventAction = this.shouldShowComments ? 'close' : 'open';
      const eventLabel = (this.moduleNames || [])
        .slice()
        .sort()
        .join(',');
      ga('send', 'event', 'comment toggle', eventAction, eventLabel);
      this.shouldShowComments = !this.shouldShowComments;
      window.localStorage.setItem(
        'shouldShowComments',
        this.shouldShowComments,
      );
    },
    handleClickTwitter() {
      ga('send', 'event', 'share', 'twitter', this.twitterShareUrl);
      window.open(this.twitterShareUrl);
    },
    handleHoverTwitter() {
      this.hoverCount++;
      ga(
        'send',
        'event',
        'hoverShare',
        'twitter',
        this.twitterShareUrl,
        this.hoverCount,
      );
    },
    handleMouseEnterTwitter() {
      this.twitterEventTimeout = setTimeout(this.handleHoverTwitter, 500);
    },
    handleMouseLeaveTwitter() {
      clearTimeout(this.twitterEventTimeout);
    },
    shuffle: _.shuffle,
  },
  components: {
    'package-input': packageInput,
    graph: require('../graph/graph.js'),
  },
});
