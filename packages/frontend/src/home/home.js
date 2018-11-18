import Vue from 'vue';
import querystring from 'querystring';
import _ from 'lodash';
import { format as formatDate, subYears } from 'date-fns';
import config from 'configs';
import { setPackages } from '../packages/packages.js';
import processPackagesStats from 'frontend/src/utils/processPackagesStats';
import getPackagesDownloads from 'utils/stats/getPackagesDownloads';
import isPackageName from 'utils/isPackageName';
import fetchReposCommitsStats from 'frontend/src/home/fetchReposCommitStats';

const palette = config.palette;
const presetPackages = config.presetPackages;

var {
  default: packageInput,
  emitter: packageEvents,
  packages,
} = require('../packages/packages');

const getAsyncDataForRoute = async to => {
  const packageNames =
    to.path === '/' || !to.params.packages
      ? _.sample(presetPackages)
      : to.params.packages
          .split(',')
          .map(packageName => window.decodeURIComponent(packageName));

  if (to.path === '/' || !to.params.packages) {
    document.title = 'Compare download stats for npm packages - npmcharts';
  } else {
    document.title =
      'Compare npm downloads for ' +
      to.params.packages.split(',').join(', ') +
      ' - npmcharts';
  }

  setTimeout(() => ga('send', 'pageview'));

  const periodLength = Number(to.query.periodLength || 7);

  // set notify to false to prevent triggering route change
  setPackages(packageNames, false);

  const DATE_FORMAT = 'YYYY-MM-DD';
  const endDate = formatDate(new Date(), DATE_FORMAT);
  const startDate = formatDate(subYears(new Date(), 1), DATE_FORMAT);

  const operation = _.every(packageNames, isPackageName)
    ? // packageNames are npm packages
      getPackagesDownloads(packageNames, {
        startDate,
        endDate,
      }).then(processPackagesStats)
    : // packageNames are github repo names
      fetchReposCommitsStats(packageNames);

  const stats = await operation;

  return {
    periodLength,
    moduleNames: packageNames,
    moduleData: stats,
    isUsingPresetPackages: !to.params.packages,
  };
};

export default {
  created() {
    this.isLoading = true;
    getAsyncDataForRoute(this.$route).then(data => {
      this.isLoading = false;
      Object.assign(this, data);
    });
  },
  template: require('./home.html'),
  data() {
    return {
      presetPackages,
      samplePreset: [],
      moduleNames: null,
      moduleData: null,
      isLoading: true,
      palette,
      showWeekends: true,
      periodLength: 7,
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
    isMinimalMode() {
      return this.$route.query.minimal === 'true';
    },
  },
  watch: {
    shouldShowComments() {
      this.$refs.graph.render();
    },
    isMinimalMode(isMinimalMode, prevIsMinimalMode) {
      console.log('watch isMinimalMode');
      if (isMinimalMode) {
        document.body.classList.add('minimal');
      } else {
        document.body.classList.remove('minimal');
      }
    },
  },
  mounted() {
    if (this.isMinimalMode) {
      document.body.classList.add('minimal');
    } else {
      document.body.classList.remove('minimal');
    }
    packageEvents.on('change', this.handlePackagesChange);
    // expose router so puppeteer can trigger route changes
    window.router = this.$route.router;
  },
  beforeDestroy() {
    packageEvents.removeListener('change', this.handlePackagesChange);
  },
  methods: {
    track(eventName, value) {
      ga('send', 'event', eventName, value);
    },
    getMergedQueryParams(params) {
      return { ...this.$route.query, ...params };
    },
    handlePackagesChange() {
      const nextRouteSansQuery = `/compare/${packages.join(',')}`;
      if (this.$route.router.app.$route.path !== nextRouteSansQuery) {
        this.$route.router.push(`${nextRouteSansQuery}?${this.queryString}`);
      }
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
        this.$route.router.push(
          '/compare/' + this.$route.params.packages + ',' + packageName,
        );
      } else {
        this.$route.router.push('/compare/' + packageName);
      }
    },
    clearPackages() {
      this.$route.router.push('/compare');
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
    graph: require('../graph/graph').default,
  },
};
