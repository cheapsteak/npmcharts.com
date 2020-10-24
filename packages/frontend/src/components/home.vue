<template>
  <!-- this div is only here because vue 2 doesn't support multiple root elements -->
  <div id="home" class="opaque-once-stylesheet-loads" style="opacity: 0;">
    <header
      class="page-header"
      :class="{
      loading: isLoadingDownloadStats,
    }"
    >
      <h1 class="heading">
        <router-link
          v-if="!isEmbedded"
          href="/"
          class="identity"
          to="/"
          title="npmcharts"
        >
          <img src="/images/logo.svg" width="190" alt="npmcharts" />
        </router-link>
        <a
          v-else
          :href=" $route.params.packages ? '/compare/' + $route.params.packages : '/' "
          class="identity"
          title="npmcharts"
        >
          <img src="/images/logo.svg" width="190" alt="npmcharts" />
        </a>
        <p
          class="sub-heading"
        >
          <template v-if="isLoadingVersionsDates">
            fetching package release dates..
          </template>
          <template v-else="packageNames && packageNames.length > 1">
            compare
            <template v-if="isUsingPresetComparisons">
              npm
            </template>
            <a
              v-else
              class="package-linkout"
              v-for="moduleName in packageNames"
              v-bind:title="'Open ' + moduleName + '\'s npm page'"
              :href="'https://www.npmjs.com/package/'+moduleName"
              target="_blank"
            >{{ moduleName }}</a>
            download trends
          </template>
        </p>

      </h1>
      <form class="header-controls-wrapper">      
        <package-input
          class="package-input"
          :on-submit="addPackage"
          :is-using-preset-packages="isUsingPresetComparisons"
        ></package-input>
        <div class="graph-config">
          <!--
        <label class="include-item" @change="track(showWeekends ? 'show-weekends' : 'hide-weekends')"><input type="checkbox" v-model="showWeekends"/>include weekends</label>
        -->

          <router-link
            tag="label"
            v-if="packageNames"
            :to="{ path: '/compare/' + packageNames.join(','), query: getMergedQueryParams({interval: 1})}"
            @click.native="track('set interval', interval)"
          >
            <input type="radio" :checked="interval === 1" /> daily
          </router-link>
          <router-link
            tag="label"
            v-if="packageNames"
            :to="{ path: '/compare/' + packageNames.join(',') + '?', query: getMergedQueryParams({interval: 7})}"
            @click.native="track('set interval', interval)"
          >
            <input type="radio" :checked="interval === 7" /> weekly
          </router-link>
          <router-link
            tag="label"
            v-if="packageNames"
            :to="{ path: '/compare/' + packageNames.join(',') + '?', query: getMergedQueryParams({interval: 30})}"
            @click.native="track('set interval', interval)"
          >
            <input type="radio" :checked="interval === 30" /> monthly
          </router-link>

          <router-link
            tag="label"
            :to="{ query: getMergedQueryParams({ log: !useLogScale }) }"
            @click.native="track('set scale', !useLogScale)"
            style="margin-left: 2em;"
          >
            <input type="checkbox" :checked="useLogScale" /> log scale
          </router-link>

          <router-link
            tag="button"
            class="minimal-mode"
            :to="{ query: getMergedQueryParams({ minimal: 'true' })}"
            @click.native="track('enter-minimal-mode')"
            >enter minimal mode</router-link
          >
          <button class="download-btn" v-on:click="handleDownloadCsv">
            download csv
          </button>
        </div>
      </form>
    </header>
    <main
      :class="{
    loading: isLoadingDownloadStats,
  }"
    >
      <div class="chart-container">
        <div class="sample-matches">
          <span
            class="tweet-this-chart"
            @click="handleClickTwitter"
            @mouseenter="handleMouseEnterTwitter"
            @mouseleave="handleMouseLeaveTwitter"
            style="
              color: #1da1f2;
              font-size: 11px;
              font-weight: 500;
              display: inline-block;
              padding: 4px 8px;
              margin-left: -4px;
            "
          >
            <i
              v-html="twitterIcon"
              aria-label="tweet"
              style="
                width: 12px;
                height: auto;
                display: inline-block;
              "
            ></i>
            this chart
          </span>
          <div class="caption">or check out</div>

          <router-link
            v-for="packages in presetComparisons"
            :to="'/compare/' + packages.join(',') + '?' + queryString"
            @click.native="track('click-preset', packages.join(','))"
            class="match"
            :key="packages.join(',')"
          >
            <template v-for="(packageItem, index) in packages">
              <span class="vs" v-if="index !==0" :key="packageItem + 'vs'"
                >, </span
              ><span
                :key="packageItem"
                class="package-name"
                :style="{
                  color: packageNames && packageNames.indexOf(packageItem) > -1 ? palette[packageNames.indexOf(packageItem) % palette.length] : ''
                }"
                >{{packageItem}}</span
              >
            </template>
          </router-link>
        </div>
        <graph
          class="chart"
          v-if="!isLoadingDownloadStats"
          ref="graph"
          :module-names="packageNames"
          :package-download-stats="packageDownloadStats"
          :interval="interval"
          :is-minimal-mode="isMinimalMode === 'true'"
          :useLogScale="useLogScale"
        >
        </graph>
        <div class="no-packages-selected" v-if="!packageDownloadStats && !isLoadingDownloadStats">
          <p>No packages selected.</p>
          <p>
            Why not try
            <router-link
              tag="span"
              class="match"
              :to="'/compare/' + samplePreset.join(',')"
            >
              <template v-for="(packageItem, index) in samplePreset">
                <span class="vs" v-if="index !==0"> vs </span>
                <span
                  class="package-name"
                  :style="{
                  color: palette[index % palette.length]
                }"
                  >{{packageItem}}</span
                >
              </template> </router-link
            >?
          </p>
        </div>
      </div>
    </main>
    <footer>
      <div class="about">
        <a
          href="https://twitter.com/CheapSteak"
          target="_blank"
          class="created-by"
        >
          Crafted in
          <img
            class="maple-leaf-icon"
            src="/images/icon-maple-leaf.svg"
            alt="Canada"
            width="16"
          />
          by Chang Wang
        </a>
      </div>
      <div>
        <a
          class="repo-link"
          href="https://github.com/cheapsteak/npmcharts.com/"
          target="_blank"
          title="Github Repo, star, fork, do what you will 😄"
        >
          <img src="/images/icon-github.svg" alt="Github Repo" width="16" />
        </a>
      </div>
      <small class="disclaimer">npm is a trademark of npm, Inc.</small>
    </footer>
  </div>
</template>

<script>

import Vue from 'vue';
import querystring from 'querystring';
import _ from 'lodash';
import { format as formatDate, subDays, isWithinRange } from 'date-fns';
import config from 'configs';
import { setPackages } from './packages.vue';
import { processPackagesStats } from 'frontend/src/utils/processPackagesStats';
import getPackagesDownloads from 'utils/stats/getPackagesDownloads';
import isPackageName from 'utils/isPackageName';
import fetchReposCommitsStats from '../utils/fetchReposCommitStats';
import { downloadCsv } from '../utils/downloadCsv';

const palette = config.palette;
const presetComparisons = _.shuffle(config.presetComparisons);

const maxRequestPeriod = 365; // ~1 year

const {
  default: packageInput,
  emitter: packageEvents,
  packages,
} = require('./packages.vue');

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

const getPackagesReleaseDataByNames = async (
  packageNames,
  startDaysOffset,
  endDaysOffset,
) => {
  const startDate = subDays(Date.now(), startDaysOffset);
  const endDate = subDays(Date.now(), endDaysOffset);
  const packageReleaseResponses = await Promise.all(
    packageNames.map(packageName =>
      fetch(`/api/npm-registry/${packageName}`)
        .then(response => response.json())
        .then(versionDateMap => [
          packageName,
          _.invertBy(
            _.omitBy(versionDateMap, (datePublished, versionName) => {
              if (['created', 'modified'].includes(versionName)) return true;
              if (!isWithinRange(datePublished, startDate, endDate))
                return true;
              if (versionName.includes('-')) return true;
            }),
            datePublished =>
              formatDate(datePublished, 'YYYY-MM-DD', null, 'UTC'),
          ),
        ]),
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

  let startDate = maxDate(startStats, subDays(new Date(), startDay));
  let endDate = maxDate(startStats, subDays(new Date(), requestEndDay));

  startDate = formatDate(startDate, 'YYYY-MM-DD', null, 'UTC');
  endDate = formatDate(endDate, 'YYYY-MM-DD', null, 'UTC');

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

export default {
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

    if (this.shouldShowVersionDates) {
      this.isLoadingVersionsDates = true;
      getPackagesReleaseDataByNames(
        this.packageNames,
        this.$route.query.start ? this.$route.query.start : 365,
        this.$route.query.end ? this.$route.query.end : 0,
      ).then(packagesVersionsDatesResponse => {
        this.packagesVersionsDatesResponse = packagesVersionsDatesResponse;
        this.isLoadingVersionsDates = false;
      });
    }
  },
  data() {
    return {
      presetComparisons,
      samplePreset: [],
      packagesDownloadStatsResponse: null,
      packagesVersionsDatesResponse: null,
      isLoadingDownloadStats: true,
      isLoadingVersionsDates: true,
      shouldShowVersionDates: true,
      palette,
      hoverCount: 0,
      twitterIcon: require('../assets/images/icon-twitter.svg'),
      shouldShowComments:
        window.innerWidth >= 1000 &&
        !JSON.parse(!!window.localStorage.getItem('shouldShowComments')),
    };
  },
  computed: {
    packageDownloadStats() {
      if (!this.packagesDownloadStatsResponse) return null;
      return processPackagesStats(
        this.packagesDownloadStatsResponse,
        this.shouldShowVersionDates ? this.packagesVersionsDatesResponse : null,
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
    handleDownloadCsv(e) {
      e.preventDefault();
      const packageNames = this.packageDownloadStats.map(x => x.name);
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
    },
    shuffle: _.shuffle,
  },
  components: {
    'package-input': packageInput,
    graph: () =>
      import(/* webpackPrefetch: true, webpackChunkName: "graph" */ './graph.vue'),
  },
};


</script>

<style scoped>
@import "../stylus/home.styl"


</style>