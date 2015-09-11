import d3 from 'd3';
import nv from 'nvd3';
import moment from 'moment';

export const palette = ['#2196F3', '#FF9800', '#CDDC39', '#f44336', '#9C27B0', '#795548', '#3F51B5', '#9E9E9E', '#FFEB3B', '##c0392b'];

export const graph = (function () {
  const margin = {top: 30, right: 40, bottom: 30, left: 30};
  const chart = nv.models.lineWithFocusChart();
  const svg = d3.select('#chart svg');
  window.ccc = chart;

  let noWeekends = true;

  function allow(entry) {
    const conditions = [
      !noWeekends || [0, 6].indexOf(entry.day.getDay()) === -1
    ];
    return _.every(conditions);
  }

  function processForD3 (input) {
    return [for (module of input) {
      key: module.name,
      values: [
        for (downloads of module.downloads)
        if (allow(downloads))
        {x: downloads.day, y: downloads.count}
      ]
    }];
  }

  nv.addGraph(function() {

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

    return chart;
  });

  let useLog;
  let data;

  return {
    render(inputData) {
      if (inputData) {
        data = inputData;
      }
      svg
        .data([processForD3(data)])
        .transition().duration(500)
        .call(chart)
      chart.x2Axis.tickValues(data[0].downloads.map(item => item.day).filter(date => date.getDate() === 1))
      chart.update()
      svg.select(".nv-y.nv-axis").attr("transform", "translate(" + nv.utils.availableWidth(null, svg, margin) + ",0)")
      svg.select('.nv-context .nv-y.nv-axis').remove()
    },
    get noWeekends () {
      return noWeekends;
    },
    set noWeekends (val) {
      noWeekends = val;
      this.render();
    },
    get useLog() {
      return useLog;
    },
    set useLog(val) {
      useLog = val;
      chart.yScale(useLog ? d3.scale.log() : d3.scale.linear());
      chart.update();
    },

  };
})();