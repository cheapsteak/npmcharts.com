import d3 from 'd3';
import nv from 'nvd3';
import moment from 'moment';
import Hammer from 'hammerjs';

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
    <div $$.chart id="chart" class="with-3d-shadow with-transitions">
      <legend v-if="moduleData.length && legendData" bind-modules="legendData.modules" bind-date="legendData.date"></legend>
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
    const margin = this.margin = {top: 0, right: 36, bottom: 30, left: 16};
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

      chart.xAxis
        .showMaxMin(false)
        .tickFormat(d => d3.time.format('%e %b')(new Date(d)))

      chart.x2Axis
        .showMaxMin(false)
        .tickFormat(d => {
          const date = moment(d);
          if (date.format('DDD') === '1') {
            return date.format('YYYY');
          } else if (date.format('D') === '1') {
            return date.format('MMM');
          }
        })

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
        // too small, looks weird, probably from mobile keyboard coming onscreen
        if (window.innerHeight < 300) {
          return;
        }
        chart.update();
        svg.select(".nv-y.nv-axis").attr("transform", "translate(" + nv.utils.availableWidth(null, svg, margin) + ",0)")
      });
      this.render();
      return chart;
    });

    const updateChart = _.debounce(() => {
      svg.call(this.chart);
    }, 50);
    this.hammerInstance = new Hammer(this.$$.chart);
    this.hammerInstance.get('pinch').set({ enable: true });
    this.hammerInstance.on('pinchin', e => {
      const [currentStart, end] = chart.brushExtent().map(x => new Date(x).getTime());
      const newStart = currentStart + Math.floor(e.distance * 1000*60*60*5);
      if (newStart <= this.moduleData[0].downloads[0].day.getTime() || newStart > end - 7 * 1000*60*60*10) {
        return;
      }
      chart.brushExtent([newStart, end]);
      updateChart();
    });
    this.hammerInstance.on('pinchout', e => {
      const [currentStart, end] = chart.brushExtent().map(x => new Date(x).getTime());
      const newStart = currentStart - Math.floor(e.distance * 1000*60*60*5);
      if (newStart <= this.moduleData[0].downloads[0].day.getTime() || newStart > end - 7 * 1000*60*60*10) {
        return;
      }
      chart.brushExtent([newStart, end]);
      updateChart();
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
      chart.yScale(this.useLog ? d3.scale.log() : d3.scale.linear());
      svg
        .data([processedData])
        .transition().duration(500)
        .call(chart)

      this.legendData = this.getDataAtDate(this.chart.xAxis.domain()[1]);
      this.applyOverrides();
    },
    applyOverrides () {
      if (!this.moduleData.length) {
        return;
      }
      const chart = this.chart;
      chart.x2Axis.tickValues(this.moduleData[0].downloads.map(item => item.day).filter(date => date.getDate() === 1))
      chart.update();

      svg.select(".nv-y.nv-axis").attr("transform", "translate(" + nv.utils.availableWidth(null, svg, this.margin) + ",0)");
      svg.select('.nv-context .nv-y.nv-axis').remove();

      const focusChartRect = document.querySelector('.nv-context').getBoundingClientRect();

      svg.call(d3.behavior.drag()
        .on('drag', e => {
          // ignore drags on the focus chart
          const {clientX, clientY} = d3.event.sourceEvent.touches ? d3.event.sourceEvent.touches[0] : d3.event.sourceEvent;
          if (clientX > focusChartRect.left
            && clientX < focusChartRect.left + focusChartRect.width
            && clientY > focusChartRect.top
            && clientY < focusChartRect.top + focusChartRect.height) {
            return;
          }
          const {dx} = d3.event;
          const [currentStart, currentEnd] = chart.brushExtent().map(x => new Date(x).getTime());
          const [newStart, newEnd] = [currentStart, currentEnd].map(x => new Date(x - dx*1000*60*60*10))
          if (
            d3.event.sourceEvent.touches && d3.event.sourceEvent.touches.length === 2
            || (newEnd >= this.moduleData[0].downloads.slice(-1)[0].day.getTime() || newStart <= this.moduleData[0].downloads[0].day.getTime())) {
            return;
          }
          chart.brushExtent([newStart, newEnd]);
          svg.call(this.chart)
        })
        .on('dragend', e => {
          this.render();
        })
      );

      svg.call(d3.behavior.zoom()
        .on('zoom', e => {
          const dy = d3.event.sourceEvent.deltaY;
          const [currentStart, end] = chart.brushExtent().map(x => new Date(x).getTime());
          const newStart = currentStart - Math.floor(dy* 1000*60*60*3);

          if (
            !(d3.event.sourceEvent instanceof WheelEvent)
            || newStart <= this.moduleData[0].downloads[0].day.getTime()
            || end - newStart <= 3 * 1000*60*60*24*7) {
            return;
          }
          chart.brushExtent([newStart, end]);
          svg.call(this.chart)
        })
      );


      var prevMousemove = chart.interactiveLayer.dispatch.on('elementMousemove');
      chart.interactiveLayer.dispatch.on('elementMousemove', (e) => {
          prevMousemove.call(chart.interactiveLayer, e);
          const date = e.pointXValue;
          try {
            this.$set('legendData', this.getDataAtDate(date));
          } catch (e) {
            console.warn(`error retrieving data for ${date}`)
          }
      });

      var prevMouseout = chart.interactiveLayer.dispatch.on('elementMouseout');
      chart.interactiveLayer.dispatch.on('elementMouseout', (e) => {
        prevMouseout.call(chart.interactiveLayer, e);
        this.legendData = this.getDataAtDate(this.chart.xAxis.domain()[1]);
      });
    },
    getDataAtDate (date) {
      date = moment(date).hours(0).minutes(0).seconds(0).milliseconds(0).toDate();
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