import Vue from 'vue';
import querystring from 'querystring';
import _ from 'lodash';
import { format as formatDate, subYears } from 'date-fns';
import config from '../../config.js';
import { setPackages } from '../packages/packages.js';
import getPackagesDownloads from '../../server/utils/stats/getPackagesDownloads';
import { startOfDay } from 'date-fns';

const palette = config.palette;

function processPackageStats(npmModuleData) {
  const downloads = npmModuleData.downloads.map(entry => ({
    day: startOfDay(entry.day),
    count: entry.downloads,
  }));
  return {
    name: npmModuleData.package,
    // if most recent day has no download count, remove it
    downloads: _.last(downloads).count === 0 ? _.initial(downloads) : downloads,
  };
}

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

      const isMinimalMode = to.query.minimal === 'true';
      const periodLength = Number(to.query.periodLength || 7);

      if (!packageNames) {
        next({
          isMinimalMode,
          periodLength,
          moduleNames: null,
          moduleData: null,
          samplePreset: _.sample(this.presetPackages),
        });
        return;
      }

      // set notify to false to prevent triggering route change
      setPackages(packageNames, false);

      const DATE_FORMAT = 'YYYY-MM-DD';
      const endDate = formatDate(new Date(), DATE_FORMAT);
      const startDate = formatDate(subYears(new Date(), 1), DATE_FORMAT);

      // can't use 'await' here or will trigger vue router error
      getPackagesDownloads(packageNames, {
        startDate,
        endDate,
      }).then(packagesDownloads => {
        const processedPackagesStats = _.compact(packagesDownloads).map(
          processPackageStats,
        );

        next({
          isMinimalMode,
          periodLength,
          moduleNames: packageNames,
          moduleData: processedPackagesStats,
          isUsingPresetPackages: !to.params.packages,
        });
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
      showWeekends: true,
      periodLength: 7,
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
    isEmbedded() {
      return this.isMinimalMode;
    },
    queryString() {
      return querystring.stringify(this.$route.query);
    },
  },
  watch: {
    shouldShowComments() {
      this.$refs.graph.render();
    },
  },
  ready() {
    if (this.isMinimalMode) {
      document.body.classList.add('minimal');
    } else {
      document.body.classList.remove('minimal');
    }
    packageEvents.on('change', () => {
      const nextRouteSansQuery = `/compare/${packages.join(',')}`;
      if (this.$route.router.app.$route.path !== nextRouteSansQuery) {
        this.$route.router.go(`${nextRouteSansQuery}?${this.queryString}`);
      }
    });
    // expose router so puppeteer can trigger route changes
    window.router = this.$route.router;
  },
  methods: {
    track(eventName, value) {
      ga('send', 'event', eventName, value);
    },
    getMergedQueryParams(params) {
      return { ...this.$route.query, ...params };
    },
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
