import d3 from 'd3';
import nv from 'nvd3';
import _ from 'lodash';
import { format as formatDate, subMonths, startOfDay } from 'date-fns';
import { line, curveCatmullRom } from 'd3-shape';
import withRender from './graph.html';

const { palette } = require('configs');

// this can't go in the data of the component, observing it changes it.
let svg;
const xAccessor = point => point.day;
const yAccessor = point => point.count;

const catmulRomInterpolation = (points, tension) =>
  line()
    .curve(curveCatmullRom)(points)
    .replace(/^M/, '');

function processEntries(entries, { showWeekends = false, interval = 7 }) {
  if (interval !== 1) {
    entries = _.flow([
      entries =>
        _.groupBy(entries, entry =>
          Math.floor((entries.length - entries.indexOf(entry) - 1) / interval),
        ),
      _.values,
      entries =>
        entries.map(entries => ({
          count: _.sumBy(entries, entry => entry.count),
          day: entries[0].day,
        })),
      /*
        x axis entries need to be in ascending order
        finding the point to highlight relies on nv.interactiveBisect
        (used in lineChart.js on "elementMousemove")
        which "Will not work if the data points move backwards
      */
      _.reverse,
    ])(entries);
  } else if (!showWeekends) {
    entries = entries.filter(
      entry => [0, 6].indexOf(entry.day.getDay()) === -1,
    );
  }

  return entries;
}

const processEntriesMemo = _.memoize(processEntries, function resolver() {
  return Array.prototype.slice.call(arguments, -1)[0];
});

export default withRender({
  props: {
    isMinimalMode: {
      type: Boolean,
      default: false,
    },
    showWeekends: {
      type: Boolean,
      default: true,
    },
    interval: {
      type: Number,
      default: 7,
    },
    moduleNames: Array,
    moduleData: Array,
  },
  data() {
    return {
      chart: nv.models.lineChart(),
      svg: null,
      useLog: false,
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
    useLog(val) {
      this.chart.yScale(val ? d3.scale.log() : d3.scale.linear());
      this.chart.update();
    },
    showWeekends() {
      this.render();
    },
    moduleData() {
      this.render();
    },
    interval() {
      this.render();
    },
  },
  mounted() {
    const margin = (this.margin = { top: 0, right: 36, bottom: 30, left: 16 });
    svg = d3.select('#chart svg');
    const chart = this.chart;

    nv.addGraph(() => {
      chart
        .margin(margin)
        .showLegend(false)
        .color(palette)
        .xScale(d3.time.scale())
        .x(xAccessor)
        .y(yAccessor)
        .useInteractiveGuideline(true);

      chart.interactiveLayer.tooltip.enabled(false);

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

      nv.utils.windowResize(function() {
        // too small, looks weird, probably from mobile keyboard coming onscreen
        if (window.innerHeight < 300) {
          return;
        }
        chart.update();
        svg
          .select('.nv-y.nv-axis')
          .attr(
            'transform',
            'translate(' + nv.utils.availableWidth(null, svg, margin) + ',0)',
          );
      });
      this.render();
      return chart;
    });
  },
  methods: {
    processForD3(input) {
      return input.map(module => ({
        key: module.name,
        values: processEntriesMemo(
          module.downloads,
          {
            showWeekends: this.showWeekends,
            interval: this.interval,
          },
          [module.name, this.showWeekends, this.interval].join(','),
        ),
      }));
    },
    render() {
      const chart = this.chart;
      const processedData = this.processForD3(this.moduleData);
      this.processedData = processedData;
      const interpolation =
        this.interval > 1 ? catmulRomInterpolation : 'linear';

      chart.interpolate(interpolation);

      chart.yScale(this.useLog ? d3.scale.log() : d3.scale.linear());
      svg
        .data([processedData])
        .transition()
        .duration(500)
        .call(chart);

      this.legendData = this.getDataAtDate(this.chart.xAxis.domain()[1]);
      this.applyOverrides();

      // signal for puppeteer to know when a new graph is rendered
      window.__currently_rendered_graph__ = this.moduleNames.join(',');
    },
    applyOverrides() {
      if (!this.moduleData.length) {
        return;
      }
      const chart = this.chart;
      // tick on the 1st of the month
      chart.x2Axis.tickValues(
        this.moduleData[0].downloads
          .map(item => item.day)
          .filter(date => date.getDate() === 1),
      );
      chart.update();

      svg
        .select('.nv-y.nv-axis')
        .attr(
          'transform',
          'translate(' +
            nv.utils.availableWidth(null, svg, this.margin) +
            ',0)',
        );
      svg.select('.nv-context .nv-y.nv-axis').remove();

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
    },
    getStartOfPeriod(date) {
      const indexInModuleData = _.findIndex(
        this.moduleData[0].downloads,
        entry => entry.day.getTime() === startOfDay(date).getTime(),
      );

      const startOfPeriodBucket = Math.floor(
        (this.moduleData[0].downloads.length - indexInModuleData) /
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
