import querystring from 'querystring';
import _ from 'lodash';
import fileSaver from 'file-saver';
import { format as formatDate, subDays, isWithinRange } from 'date-fns';
import config from 'configs';
import { setPackages } from '../packages/packages.js';
import { processPackagesStats } from 'frontend/src/utils/processPackagesStats';
import getPackagesDownloads from 'utils/stats/getPackagesDownloads';
import isPackageName from 'utils/isPackageName';
import fetchReposCommitsStats from 'frontend/src/home/fetchReposCommitStats';
import fetchBundlesSizes from 'frontend/src/home/fetchBundlesSizes';
import withRender from './home.html';
import { downloadCsv } from './downloadCsv';
import { domNodeToSvg, domNodeToPng } from '../utils/dom-to-image';
import getPackageRequestPeriods from 'utils/getPackageRequestPeriods';
import contributors from './contributors.json';

const palette = config.palette;
const presetComparisons = _.shuffle(config.presetComparisons);

const {
  default: packageInput,
  emitter: packageEvents,
  packages,
} = require('../packages/packages');

const getPackagesDownloadDataByNames = async (names, start, end) => {
  setTimeout(() => ga('send', 'pageview'));

  // set notify to false to prevent triggering route change
  setPackages(names, false);

  const operation = _.every(names, isPackageName)
    ? // names are npm packages
      getPackagesDownloadsOverPeriod(names, start, end)
    : // names are github repo names
      fetchReposCommitsStats(names);

  return operation;
};

const getPackagesMetaDataByNames = async (
  packageNames,
  startDaysOffset,
  endDaysOffset,
) => {
  const startDate = subDays(Date.now(), startDaysOffset);
  const endDate = subDays(Date.now(), endDaysOffset);
  const packageReleaseResponses = await Promise.all(
    packageNames.map(packageName =>
      fetch(`/api/npm-metadata/${packageName}`)
        .then(response => response.json())
        .then(metadata => {
          const releaseDates = _.invertBy(
            _.omitBy(
              metadata.releaseDatesByVersion,
              (datePublished, versionName) => {
                if (['created', 'modified'].includes(versionName)) return true;
                if (!isWithinRange(datePublished, startDate, endDate))
                  return true;
                if (versionName.includes('-')) return true;
              },
            ),
            datePublished =>
              formatDate(datePublished, 'YYYY-MM-DD', null, 'UTC'),
          );
          return [
            packageName,
            {
              releaseDates,
              hasTypings: metadata.hasTypings,
              definitivelyTyped: metadata.definitivelyTyped,
            },
          ];
        }),
    ),
  );
  return Object.fromEntries(packageReleaseResponses);
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

let contributorCounter = 0;
const shuffledContributorsList = _.shuffle(contributors);
/**
 * Get a contributor from the list, randomly
 */
function getContributorRandom() {
  return shuffledContributorsList[
    contributorCounter++ % shuffledContributorsList.length
  ];
}

/**
 * @param names    {string} Package names
 * @param startDay {number} Start of period, 1 is yesterday
 * @param endDay   {number} End of period 0 is today
 * @returns {Promise<any>}
 */
async function getPackagesDownloadsOverPeriod(names, startDay, endDay) {
  const requestPeriods = getPackageRequestPeriods(startDay, endDay);
  const promises = requestPeriods.map(period => {
    return getPackagesDownloads(names, {
      startDate: period.startDate,
      endDate: period.endDate,
    });
  });
  const periods = await Promise.all(promises);
  const mergedPeriod = periods.reduce(
    (mergedPeriodsSoFar, currentPeriod, currentIndex) => {
      if (currentIndex === 0) {
        // Because the first period is used as init
        return mergedPeriodsSoFar;
      }
      return mergePeriods(mergedPeriodsSoFar, currentPeriod);
    },
    periods[0],
  );

  return mergedPeriod;
}

export default withRender({
  created() {
    this.isLoadingDownloadStats = true;
    getPackagesDownloadDataByNames(
      this.packageNames,
      this.$route.query.start ? this.$route.query.start : 365,
      this.$route.query.end ? this.$route.query.end : 0,
    ).then(packagesDownloadStatsResponse => {
      this.packagesDownloadStatsResponse = packagesDownloadStatsResponse;
      this.isLoadingDownloadStats = false;
    });

    if (this.shouldShowNpmMetaData) {
      this.isLoadingNpmMetaData = true;
      getPackagesMetaDataByNames(
        this.packageNames,
        this.$route.query.start ? this.$route.query.start : 365,
        this.$route.query.end ? this.$route.query.end : 0,
      ).then(response => {
        this.npmMetadataByPackageName = response;
        this.isLoadingNpmMetaData = false;
      });
    }

    if (this.shouldFetchBundleSizes) {
      this.packagesBundleSizesResponse = fetchBundlesSizes(this.packageNames);
    }
  },
  render: withRender.default,
  data() {
    return {
      presetComparisons,
      samplePreset: [],
      packagesDownloadStatsResponse: null,

      packagesBundleSizesResponse: null,
      isLoadingDownloadStats: true,

      shouldShowVersionDates: true,

      isLoadingNpmMetaData: true,
      shouldShowNpmMetaData: true,
      npmMetadataByPackageName: null,

      shouldFetchBundleSizes: true,
      palette,
      hoverCount: 0,
      twitterIcon: require('../assets/images/icon-twitter.svg'),
      shouldShowComments:
        window.innerWidth >= 1000 &&
        !JSON.parse(!!window.localStorage.getItem('shouldShowComments')),
      exportStatus: null,
      contributorInfo: getContributorRandom(),
    };
  },
  computed: {
    packageDownloadStats() {
      if (!this.packagesDownloadStatsResponse) return null;
      return processPackagesStats(
        this.packagesDownloadStatsResponse,
        this.shouldShowVersionDates ? this.npmMetadataByPackageName : null,
      );
    },
    shareUrl() {
      return (
        this.packageNames &&
        `http://npmcharts.com/compare/${this.packageNames.join(',')}`
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
    isUsingPresetComparisons() {
      return !this.$route.params.packages;
    },
    packageNames() {
      const packageNames = this.isUsingPresetComparisons
        ? _.sample(presetComparisons)
        : this.$route.params.packages
            .split(',')
            .map(packageName => window.decodeURIComponent(packageName));
      return packageNames;
    },
    isMinimalMode() {
      return this.$route.query.minimal === 'true';
    },
    useLogScale() {
      return this.$route.query.log === 'true' || this.$route.query.log === true;
    },
  },
  watch: {
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
        `${packageName} existing:${this.packageNames}`,
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
    handleDownloadRequest(e) {
      const packageNames = this.packageDownloadStats.map(x => x.name);
      switch (e.target.value) {
        case 'png':
          this.exportStatus = 'exporting png';
          setTimeout(() => {
            domNodeToPng(this.$refs.graph.$el).then(dataUrl => {
              fileSaver.saveAs(dataUrl, `${packageNames}.png`);
              this.exportStatus = null;
            });
          });
          break;
        case 'svg':
          this.exportStatus = 'exporting svg';
          setTimeout(() => {
            domNodeToSvg(this.$refs.graph.$el).then(dataUrl => {
              fileSaver.saveAs(dataUrl, `${packageNames}.svg`);
              this.exportStatus = null;
            });
          });
          break;
        case 'csv':
          this.exportStatus = 'exporting csv';
          setTimeout(() => {
            const moduleWithLongestHistory = _.maxBy(
              this.packageDownloadStats,
              x => x.entries.length,
            );
            var csv = [['Date', ...packageNames]]
              .concat(
                moduleWithLongestHistory.entries.map(({ day, downloads }) => {
                  return [day.toLocaleDateString()].concat(
                    this.packageDownloadStats
                      .map(
                        packageDownloadStats =>
                          packageDownloadStats.entries.find(
                            x => x.day.toISOString() === day.toISOString(),
                          ).count || '',
                      )
                      .join(','),
                  );
                }),
              )
              .join('\n');
            this.track('download csv', packageNames);
            downloadCsv(csv, `${packageNames}.csv`);
            this.exportStatus = null;
          });
          break;
        default:
        case '':
          this.exportStatus = null;
          return;
      }
      e.target.value = '';
    },
    shuffle: _.shuffle,
    handleClickContributor() {
      this.contributorInfo = getContributorRandom();
      this.track('click contributor');
    },
  },
  components: {
    'package-input': packageInput,
    graph: () =>
      import(
        /* webpackPrefetch: true, webpackChunkName: "graph" */ '../graph/graph'
      ),
  },
});
