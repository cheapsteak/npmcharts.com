import d3 from 'd3';
import nv from 'nvd3';
import moment from 'moment';

export const palette = ['#2196F3', '#FF9800', '#CDDC39', '#f44336', '#9C27B0', '#795548', '#3F51B5', '#9E9E9E', '#FFEB3B', '##c0392b'];

function processForD3 (input) {
  return [for (module of input) {
    key: module.name,
    values: [
      for (downloads of module.downloads)
      {x: downloads.day, y: downloads.count}
    ]
  }];
}

export const graph = (function () {
  const margin = {top: 30, right: 40, bottom: 30, left: 30};
  const chart = nv.models.lineWithFocusChart();
  const svg = d3.select('#chart svg');

  nv.addGraph(function() {

    chart
      .margin(margin)
      .showLegend(false)
      .color(palette)
      .xScale(d3.time.scale())

    chart.xAxis
      .showMaxMin(false)
      .tickFormat(d => d3.time.format('%e %b %Y')(new Date(d)));

    chart.x2Axis
      .tickFormat(d => d3.time.format('%e %b %Y')(new Date(d)));

    chart.yAxis
      .orient('right')
      .showMaxMin(false)
      .tickFormat(d3.format('s'));

    chart.y2Axis
      .showMaxMin(false)
      .tickFormat(d3.format('s'));

    // focus on an area
    chart.brushExtent([moment().subtract(3, 'month').toDate(), moment().toDate()])

    nv.utils.windowResize(function () {
      chart.update();
      svg.select(".nv-y.nv-axis").attr("transform", "translate(" + nv.utils.availableWidth(null, svg, margin) + ",0)");
    });

    return chart;
  });

  let useLog;

  return {
    render(data) {
      svg
        .data([processForD3(data)])
        .transition().duration(500)
        .call(chart)
        .select(".nv-y.nv-axis").attr("transform", "translate(" + nv.utils.availableWidth(null, svg, margin) + ",0)")
    },
    get useLog() {
      return useLog;
    },
    set useLog(val) {
      useLog = val;
      chart.yScale(useLog ? d3.scale.log() : d3.scale.linear());
      chart.update();
    }
  };
})();