<template>
  <div ref="chart" id="chart" class="with-3d-shadow with-transitions">
  <graphLegend
    v-if="packageDownloadStats.length && legendData"
    :modules="legendData.modules"
    :interval="interval"
    :date="legendData.date"
    @package-focus="handlePackageFocus"
    @package-blur="handlePackageBlur"
    @legend-blur="handleLegendBlur"
    @legend-focus="handleLegendFocus"
  >
  </graphLegend>
  <svg></svg>
</div>

</template>

<script>
import d3 from 'd3';
import nv from 'nvd3';
import _ from 'lodash';
import { format as formatDate, startOfDay } from 'date-fns';
import { line, curveCatmullRom } from 'd3-shape';
import { lineChart, xAccessor } from './chart/lineChart';

const { palette } = require('configs');

// this can't go in the data of the component, observing it changes it.
let svg;

const catmulRomInterpolation = (points, tension) =>
  line()
    .curve(curveCatmullRom)(points)
    .replace(/^M/, '');

function processEntries(entries, { interval = 7 }) {
  if (interval !== 1) {
    entries = _.flow([
      entries =>
        _.groupBy(entries, entry =>
          Math.floor((entries.length - entries.indexOf(entry) - 1) / interval),
        ),
      _.values,
      entries =>
        entries.map(entriesInGroup => ({
          count: _.sumBy(entriesInGroup, entry => entry.count),
          day: entriesInGroup[0].day,
          releases: entriesInGroup.flatMap(entry => entry.releases),
        })),
      /*
        x axis entries need to be in ascending order
        finding the point to highlight relies on nv.interactiveBisect
        (used in lineChart.js on "elementMousemove")
        which "Will not work if the data points move backwards
      */
      _.reverse,
    ])(entries);
  }

  return entries;
}

const processEntriesMemo = _.memoize(processEntries, (...args) => {
  return JSON.stringify(args);
});

export default {
  props: {
    isMinimalMode: {
      type: Boolean,
      default: false,
    },
    interval: {
      type: Number,
      default: 7,
    },
    moduleNames: Array,
    packageDownloadStats: Array,
    useLogScale: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      chart: null,
      svg: null,
      legendData: null,
      moduleSizes: {},
    };
  },
  computed: {
    // in case a module
    seriesWithMostDataPoints() {
      return _.sortBy(this.processedData, series => series.values.length)[
        this.processedData.length - 1
      ];
    },
  },
  watch: {
    useLogScale(val) {
      this.chart.yScale(val ? d3.scale.log() : d3.scale.linear());
      this.chart.useLogScale(val);
      this.chart.update();
    },
    packageDownloadStats() {
      this.render();
    },
    interval() {
      this.render();
    },
  },
  mounted() {
    this.render();
    window.addEventListener('resize', () => {
      // too small, looks weird, probably from mobile keyboard coming onscreen
      if (window.innerHeight < 300) {
        return;
      }
      this.chart.update();
      svg
        .select('.nv-y.nv-axis')
        .attr(
          'transform',
          'translate(' +
            nv.utils.availableWidth(null, svg, this.margin) +
            ',0)',
        );
    });
  },
  methods: {
    processForD3(downloadStats) {
      return downloadStats.map(({ name, entries }) => ({
        key: name,
        values: processEntriesMemo(
          entries,
          {
            interval: this.interval,
          },
          [name, this.showWeekends, this.interval].join(','),
        ),
      }));
    },
    render() {
      const margin = (this.margin = {
        top: 0,
        right: 36,
        bottom: 30,
        left: 16,
      });
      svg = d3.select('#chart svg');
      const chart = (this.chart = lineChart());

      chart.margin(margin).color(palette);

      chart.xAxis
        .showMaxMin(false)
        .tickFormat(d => d3.time.format('%e %b')(new Date(d)));

      const dateAxis = chart.xAxis;

      dateAxis.showMaxMin(false).tickFormat(d => {
        if (formatDate(d, 'DDD') === '1') {
          return formatDate(d, 'YYYY');
        } else if (formatDate(d, 'D') === '1') {
          return formatDate(d, 'MMM');
        }
      });

      chart.yAxis
        .orient('right')
        .showMaxMin(false)
        .tickFormat(d3.format('s'));

      const processedData = this.processForD3(this.packageDownloadStats);
      this.processedData = processedData;
      const interpolation =
        this.interval > 1 ? catmulRomInterpolation : 'linear';

      chart.interpolate(interpolation);

      chart.yScale(this.useLogScale ? d3.scale.log() : d3.scale.linear());
      chart.useLogScale(this.useLogScale);
      svg.data([processedData]).call(chart);

      this.legendData = this.getDataAtDate(this.chart.xAxis.domain()[1]);

      if (!this.packageDownloadStats.length) {
        return;
      }

      // Update legend on mousemove
      var prevMousemove = chart.interactiveLayer.dispatch.on(
        'elementMousemove',
      );

      chart.interactiveLayer.dispatch.on('elementMousemove', e => {
        prevMousemove.call(chart.interactiveLayer, e);
        const date = e.pointXValue;
        try {
          const nearestPointIndex = nv.interactiveBisect(
            this.seriesWithMostDataPoints.values,
            date,
            xAccessor,
          );
          const point = this.seriesWithMostDataPoints.values[nearestPointIndex];
          this.legendData = this.getDataAtDate(xAccessor(point));
        } catch (e) {
          console.warn(`error retrieving data for ${date}`);
        }
      });

      // Reset legend data to current date's when mouse leaves interactiveLayer
      var prevMouseout = chart.interactiveLayer.dispatch.on('elementMouseout');
      chart.interactiveLayer.dispatch.on('elementMouseout', e => {
        prevMouseout.call(chart.interactiveLayer, e);
        this.legendData = this.getDataAtDate(this.chart.xAxis.domain()[1]);
      });

      // signal for puppeteer to know when a new graph is rendered
      window.__currently_rendered_graph__ = this.moduleNames.join(',');
    },
    getStartOfPeriod(date) {
      const indexInPackageDownloadStats = _.findIndex(
        this.packageDownloadStats[0].entries,
        entry => entry.day.getTime() === startOfDay(date).getTime(),
      );

      const startOfPeriodBucket = Math.floor(
        (this.packageDownloadStats[0].entries.length -
          indexInPackageDownloadStats) /
          this.interval,
      );

      return this.processedData[0].values[
        Math.max(0, this.processedData[0].values.length - startOfPeriodBucket)
      ].day;
    },
    getDataAtDate(date) {
      const modules = this.processedData;

      const startOfPeriod = this.getStartOfPeriod(date);

      return {
        date,
        modules: modules.map((module, i) => ({
          color: palette[i % palette.length],
          name: module.key,
          downloads: _.get(
            _.find(
              module.values,
              entry => entry.day.getTime() === startOfPeriod.getTime(),
            ),
            'count',
            0,
          ),
        })),
      };
    },
    handlePackageFocus(moduleName) {
      svg.selectAll('.nv-series--focused').classed('nv-series--focused', false);
      svg
        .selectAll(`.nv-series-${this.moduleNames.indexOf(moduleName)}`)
        .classed('nv-series--focused', true);
    },
    handlePackageBlur(moduleName) {
      svg
        .selectAll(`.nv-series-${this.moduleNames.indexOf(moduleName)}`)
        .classed('nv-series--focused', false);
    },
    handleLegendFocus() {
      svg.selectAll('.nv-focus .nv-groups').classed('nv-groups--focused', true);
    },
    handleLegendBlur() {
      svg.selectAll('.nv-series--focused').classed('nv-series--focused', false);
      svg
        .selectAll('.nv-focus .nv-groups')
        .classed('nv-groups--focused', false);
    },
  },
  components: {
    graphLegend: require('./legend.vue').default,
  },
};

</script>

<style scoped>
@import '../stylus/legend.styl'

$lineColor = #f3f3f3;
.nvd3 .nv-axis line
  stroke: $lineColor;

.nv-guideline
  display: none
.nvd3
  .nv-axis.nv-x, .nv-axis.nv-y
    path.domain
      stroke-opacity: 0.3
      stroke: #8398a9
  .tick text
    fill: #8398a9

.nv-linesWrap path.nv-line
  stroke-width: 2px

.chart
  .legend
    position: absolute
    left: 0
    top: 10px
    background-color: rgba(white, 0.7)
    @media (min-width: $small)
      left: 22px
  .nv-context .nv-axis.nv-x text
    @media (max-width: 550px)
      display: none

#chart
  .nv-focus
    .nv-point, .nv-line
      transition: stroke-opacity 0.12s, fill-opacity 0.12s, stroke-width 0.12s;
  .nv-focus
    .nv-groups
      &:not(.nv-groups--focused)
        > .nv-group
          .nv-line
            stroke-opacity: 0.35 !important
      &.nv-groups--focused
        > .nv-group:not(.nv-series--focused)
          .nv-line
            stroke-opacity: 0.1 !important
          .nv-point
            fill-opacity: 0.1 !important
        > .nv-series--focused
          stroke-opacity: 0.35 !important
          .nv-line
            stroke-width: 2.5px
    .nv-scatterWrap
      .nv-point
        &[releases]:not([releases=""])
          // path
          //   stroke: #ffffff
          //   paint-order: stroke;
          &.hover path
            stroke: inherit
            stroke-width: 5


      .nv-point text
        stroke-width: 0
        fill: transparent
        font-weight: bold
        font-family monospace

        paint-order: stroke;
        stroke: #ffffff;
        stroke-width: 3px;
        stroke-linecap: butt;
        stroke-linejoin: round;
      .nv-point.hover text
        fill: inherit
      .nv-point:not(.hover)
        stroke-width: 0
        fill-opacity: 1

  .nv-context
    .nv-line > g > .nv-groups > .nv-group
      stroke-opacity: 0.7 !important

  .nvd3 .nv-brushBackground rect
    stroke-opacity: 0.3
  .nv-axisMaxMin
    // for some reason the `showMaxMin` option is ignored when in minimal mode
    display: none;

</style>