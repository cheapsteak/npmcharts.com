import d3 from 'd3';
import nv from 'nvd3';
import moment from 'moment';

const {palette} = require('../../config.js');
// this can't go in the data of the component, observing it changes it.
let svg;

export default Vue.extend({
  props: {
    noWeekends: {
      type: Boolean,
      default: true
    },
    moduleNames: Array,
    moduleData: Array
  },
  template: `
    <div id="chart" class="with-3d-shadow with-transitions">
      <legend v-if="legendData" bind-modules="legendData.modules" bind-date="legendData.date"></legend>
      <svg></svg>
    </div>
  `,
  data () {
    return {
      chart: nv.models.lineWithFocusChart(),
      svg: null,
      useLog: false,
      legendData: null
    }
  },
  watch: {
    useLog (val) {
      this.chart.yScale(val ? d3.scale.log() : d3.scale.linear());
      this.chart.update();
    },
    noWeekends () {
      this.render();
    },
    moduleData () {
      this.render();
    }
  },
  ready () {
    window.ggg = this;
    const margin = this.margin = {top: 0, right: 26, bottom: 30, left: 0};
    svg =  d3.select('#chart svg');
    const chart = this.chart;
    nv.addGraph(() => {
      chart
        .margin(margin)
        .showLegend(false)
        .color(palette)
        .xScale(d3.time.scale())
        .useInteractiveGuideline(true)
      chart.interactiveLayer.tooltip.enabled(false);

      chart.interactiveLayer.tooltip.fixedTop(100);
      chart.interactiveLayer.tooltip.position({left: 0});

      chart.xAxis
        .showMaxMin(false)
        .tickFormat(d => d3.time.format('%e %b')(new Date(d)))

      chart.x2Axis
        .showMaxMin(false)
        .tickFormat(d => d3.time.format('%b %Y')(new Date(d)))

      chart.yAxis
        .orient('right')
        .showMaxMin(false)
        .tickFormat(d3.format('s'))

      chart.y2Axis
        .showMaxMin(false)
        .tickFormat(d3.format('s'))

      // focus on an area
      chart.brushExtent([moment().subtract(3, 'month').toDate(), moment().toDate()])

      nv.utils.windowResize(function () {
        chart.update();
        svg.select(".nv-y.nv-axis").attr("transform", "translate(" + nv.utils.availableWidth(null, svg, margin) + ",0)")
      });
      this.render();
      return chart;
    });
  },
  methods: {
    allow (entry) {
      const conditions = [
        !this.noWeekends || [0, 6].indexOf(entry.day.getDay()) === -1
      ];
      return _.every(conditions);
    },
    processForD3 (input) {
      return [for (module of input) {
        key: module.name,
        values: [
          for (downloads of module.downloads)
          if (this.allow(downloads))
          {x: downloads.day, y: downloads.count}
        ]
      }];
    },
    render () {
      const chart = this.chart;
      const processedData = this.processForD3(this.moduleData);
      svg
        .data([processedData])
        .transition().duration(500)
        .call(chart)
      this.legendData = this.getDataAtDate(processedData[0].values.slice(-1)[0].x);
      this.applyOverrides(processedData);
    },
    applyOverrides (processedData) {
      const chart = this.chart;
      chart.x2Axis.tickValues(this.moduleData[0].downloads.map(item => item.day).filter(date => date.getDate() === 1))
      chart.update();

      svg.select(".nv-y.nv-axis").attr("transform", "translate(" + nv.utils.availableWidth(null, svg, this.margin) + ",0)");
      svg.select('.nv-context .nv-y.nv-axis').remove();

      var prevMousemove = chart.interactiveLayer.dispatch.on('elementMousemove');
      chart.interactiveLayer.dispatch.on('elementMousemove', (e) => {
          prevMousemove.call(chart.interactiveLayer, e);
          const date = moment(e.pointXValue).hours(0).minutes(0).seconds(0).milliseconds(0).toDate();
          try {
            this.$set('legendData', this.getDataAtDate(date));
          } catch (e) {
            console.warn(`error retrieving data for ${date}. Probably moused in from the side`)
          }
      });

      var prevMouseout = chart.interactiveLayer.dispatch.on('elementMouseout');
      chart.interactiveLayer.dispatch.on('elementMouseout', (e) => {
        prevMouseout.call(chart.interactiveLayer, e);
        this.legendData = this.getDataAtDate(processedData[0].values.slice(-1)[0].x);
      });
    },
    getDataAtDate (date) {
      return {
        date: date,
        modules: this.moduleData.map( (module, i) => {
          return {
            color: palette[i%palette.length],
            name: module.name,
            downloads: _.find(module.downloads, entry => entry.day.getTime() === date.getTime()).count
          }
        })
      };
    }
  },
  components: {
    legend: require('./legend/legend.js')
  }
});