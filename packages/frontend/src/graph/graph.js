import d3 from 'd3';
import nv from 'nvd3';
import _ from 'lodash';
import { format as formatDate, startOfDay } from 'date-fns';
import { line, curveCatmullRom } from 'd3-shape';
import withRender from './graph.html';
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

export default withRender({
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
    graphLegend: require('./legend/legend').default,
  },
});
