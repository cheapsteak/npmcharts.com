import d3 from 'd3';
import nv from 'nvd3';
import moment from 'moment';

const {palette} = require('../../config.js');
// const margin = {top: 30, right: 40, bottom: 30, left: 30};
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
      <slot name="legend"></slot>
      <svg></svg>
    </div>
  `,
  data () {
    return {
      chart: nv.models.lineWithFocusChart(),
      svg: null,
      useLog: false
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
    // const margin = {top: 30, right: 40, bottom: 30, left: 30};
    // const sidePanel = document.querySelector('.side-panel');
    // const margin = this.margin = {top: 30, right: 40, bottom: 30, left: sidePanel.offsetWidth + sidePanel.getBoundingClientRect().left + 30};
    const margin = this.margin = {top: 30, right: 40, bottom: 30, left: 30};
    svg =  d3.select('#chart svg');
    const chart = this.chart;
    nv.addGraph(() => {
      chart
        .margin(margin)
        .showLegend(false)
        .color(palette)
        .xScale(d3.time.scale())
        .useInteractiveGuideline(true)

        // debugger
      chart.tooltip.enabled(false);

      chart.xAxis
        .showMaxMin(false)
        .tickFormat(d => d3.time.format('%e %b %Y')(new Date(d)))

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

      chart.tooltip.valueFormatter(d => d3.format(',')(d), d => d3.time.format('%b %Y')(new Date(d)));
      chart.interactiveLayer.tooltip.valueFormatter(d => d3.format(',')(d), d => d3.time.format('%b %Y')(new Date(d)));

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
    allow(entry) {
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
    render() {
      const chart = this.chart;
      const data = this.moduleData;
      svg
        .data([this.processForD3(data)])
        .transition().duration(500)
        .call(chart)
      chart.x2Axis.tickValues(data[0].downloads.map(item => item.day).filter(date => date.getDate() === 1))
      chart.update()
      svg.select(".nv-y.nv-axis").attr("transform", "translate(" + nv.utils.availableWidth(null, svg, this.margin) + ",0)")
      svg.select('.nv-context .nv-y.nv-axis').remove()
    }
  }
});