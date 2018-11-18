import querystring from 'querystring';
import _ from 'lodash';
import { format as formatDate, subYears } from 'date-fns';
import config from 'configs';
import { setPackages } from '../packages/packages.js';
import processPackagesStats from 'frontend/src/utils/processPackagesStats';
import getPackagesDownloads from 'utils/stats/getPackagesDownloads';
import isPackageName from 'utils/isPackageName';
import fetchReposCommitsStats from 'frontend/src/home/fetchReposCommitStats';
import withRender from './home.html';

const palette = config.palette;
const presetPackages = _.shuffle(config.presetPackages);

var {
  default: packageInput,
  emitter: packageEvents,
  packages,
} = require('../packages/packages');

const getModuleDataByNames = async names => {
  setTimeout(() => ga('send', 'pageview'));

  // set notify to false to prevent triggering route change
  setPackages(names, false);

  const DATE_FORMAT = 'YYYY-MM-DD';
  const endDate = formatDate(new Date(), DATE_FORMAT);
  const startDate = formatDate(subYears(new Date(), 1), DATE_FORMAT);

  const operation = _.every(names, isPackageName)
    ? // names are npm packages
      getPackagesDownloads(names, {
        startDate,
        endDate,
      }).then(processPackagesStats)
    : // names are github repo names
      fetchReposCommitsStats(names);

  return operation;
};

export default withRender({
  created() {
    this.isLoading = true;
    getModuleDataByNames(this.moduleNames).then(moduleData => {
      this.isLoading = false;
      this.moduleData = moduleData;
    });
  },
  render: withRender.default,
  data() {
    return {
      presetPackages,
      samplePreset: [],
      moduleData: null,
      isLoading: true,
      palette,
      showWeekends: true,
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
    periodLength() {
      return Number(this.$route.query.periodLength || 7);
    },
    isUsingPresetPackages() {
      return !this.$route.params.packages;
    },
    moduleNames() {
      const moduleNames = this.isUsingPresetPackages
        ? _.sample(presetPackages)
        : this.$route.params.packages
            .split(',')
            .map(packageName => window.decodeURIComponent(packageName));
      return moduleNames;
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
    window.router = this.$router;
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
      if (this.$router.app.$route.path !== nextRouteSansQuery) {
        this.$router.push(`${nextRouteSansQuery}?${this.queryString}`);
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
        this.$router.push(
          '/compare/' + this.$route.params.packages + ',' + packageName,
        );
      } else {
        this.$router.push('/compare/' + packageName);
      }
    },
    clearPackages() {
      this.$router.push('/compare');
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
});
