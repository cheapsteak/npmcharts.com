import querystring from 'querystring';
import _ from 'lodash';
import { format as formatDate, subDays } from 'date-fns';
import config from 'configs';
import { setPackages } from '../packages/packages.js';
import processPackagesStats from 'frontend/src/utils/processPackagesStats';
import getPackagesDownloads from 'utils/stats/getPackagesDownloads';
import isPackageName from 'utils/isPackageName';
import fetchReposCommitsStats from 'frontend/src/home/fetchReposCommitStats';
import withRender from './home.html';
import { downloadCsv } from './downloadCsv';

const palette = config.palette;
const presetPackages = _.shuffle(config.presetPackages);

const maxRequestPeriod = 365; // ~1 year

const {
  default: packageInput,
  emitter: packageEvents,
  packages,
} = require('../packages/packages');

const getModuleDataByNames = async (names, start, end) => {
  setTimeout(() => ga('send', 'pageview'));

  // set notify to false to prevent triggering route change
  setPackages(names, false);

  const operation = _.every(names, isPackageName)
    ? // names are npm packages
      getPackagesDownloadsOverPeriod(names, start, end).then(
        processPackagesStats,
      )
    : // names are github repo names
      fetchReposCommitsStats(names);

  return operation;
};

/**
 * Merge 2 statistic periods
 * @param period0 Period before period1
 * @param period1 Period after period0
 * @returns The merged period
 */
function mergePeriods(period0, period1) {
  const sumPackages = [];

  for (let p = 0; p < period0.length; ++p) {
    sumPackages.push({
      downloads: period0[p].downloads.concat(period1[p].downloads),
      package: period0[p].package,
      start: period0[p].start,
      end: period1[p].end,
    });
  }

  return sumPackages;
}

function maxDate(a, b) {
  return new Date(Math.max(a.getTime(), b.getTime()));
}

/**
 * @param names    {string} Package names
 * @param startDay {number} Start of period, 1 is yesterday
 * @param endDay   {number} End of period 0 is today
 * @returns {Promise<any>}
 */
function getPackagesDownloadsOverPeriod(names, startDay, endDay) {
  const requestPeriod = Math.min(maxRequestPeriod, startDay - endDay);
  const requestEndDay = startDay - requestPeriod;

  const startStats = new Date(Date.UTC(2015, 1, 10));

  const DATE_FORMAT = 'YYYY-MM-DD';
  const timezone = 'UTC';

  let startDate = maxDate(startStats, subDays(new Date(), startDay));
  let endDate = maxDate(startStats, subDays(new Date(), requestEndDay));

  startDate = formatDate(startDate, DATE_FORMAT, null, timezone);
  endDate = formatDate(endDate, DATE_FORMAT, null, timezone);

  const period1 = getPackagesDownloads(names, { startDate, endDate });

  if (requestEndDay > 0) {
    const period2 = getPackagesDownloadsOverPeriod(
      names,
      startDay - requestPeriod - 1,
      endDay,
    );
    return Promise.all([period1, period2]).then(res =>
      mergePeriods(res[0], res[1]),
    );
  }
  return period1;
}

export default withRender({
  created() {
    this.isLoading = true;
    getModuleDataByNames(
      this.moduleNames,
      this.$route.query.start ? this.$route.query.start : 365,
      this.$route.query.end ? this.$route.query.start : 0,
    ).then(moduleData => {
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
    interval() {
      return Number(
        this.$route.query.interval || this.$route.query.periodLength || 7,
      );
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
      const merged = { ...this.$route.query, ...params };
      delete merged.periodLength;
      return merged;
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

      this.$router.push({
        path: `/compare/${
          this.$route.params && this.$route.params.packages
            ? this.$route.params.packages + ',' + packageName
            : packageName
        }`,
        query: this.$route.query,
      });
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
    handleDownloadCsv(e) {
      e.preventDefault();
      const moduleNames = this.moduleData.map(x => x.name);
      const moduleWithLongestHistory = _.maxBy(
        this.moduleData,
        x => x.downloads.length,
      );
      var csv = [['Date', ...moduleNames]]
        .concat(
          moduleWithLongestHistory.downloads.map(({ day, downloads }) => {
            return [day.toLocaleDateString()].concat(
              this.moduleData
                .map(
                  moduleData =>
                    moduleData.downloads.find(
                      x => x.day.toISOString() === day.toISOString(),
                    ).count || '',
                )
                .join(','),
            );
          }),
        )
        .join('\n');
      downloadCsv(csv, `${moduleNames}.csv`);
    },
    shuffle: _.shuffle,
  },
  components: {
    'package-input': packageInput,
    graph: require('../graph/graph').default,
  },
});
