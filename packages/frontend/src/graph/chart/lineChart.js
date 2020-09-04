import nv from 'nvd3';
import d3 from 'd3';
import { line } from './line';

export const xAccessor = point => point.day;
export const yAccessor = point => point.count;

// copied from from nvd3 1.8.3
// and removed unused features
// https://github.com/novus/nvd3/blob/254bb456667d4752947cf874e303b60beb6661b5/src/models/lineChart.js
export function lineChart() {
  //============================================================
  // Public Variables with Default Settings
  //------------------------------------------------------------

  var lines = line(),
    xAxis = nv.models.axis(),
    yAxis = nv.models.axis(),
    interactiveLayer = nv.interactiveGuideline();

  var margin = { top: 30, right: 20, bottom: 50, left: 60 },
    color = nv.utils.defaultColor(),
    width = null,
    height = null,
    rightAlignYAxis = true,
    x,
    y,
    dispatch = d3.dispatch('renderEnd'),
    duration = 250;

  // set options on sub-objects for this chart
  xAxis.orient('bottom').tickPadding(7);
  yAxis.orient(rightAlignYAxis ? 'right' : 'left');

  lines.clipEdge(true);
  lines.x(xAccessor);
  lines.y(yAccessor);

  //============================================================
  // Private Variables
  //------------------------------------------------------------

  function chart(selection) {
    selection.each(function(data) {
      var container = d3.select(this);
      nv.utils.initSVG(container);
      var availableWidth = nv.utils.availableWidth(width, container, margin),
        availableHeight1 =
          nv.utils.availableHeight(height, container, margin) - 0;

      chart.update = function() {
        container.call(chart);
      };
      chart.container = this;

      // Display noData message if there's nothing to show.
      if (
        !data ||
        !data.length ||
        !data.filter(function(d) {
          return d.values.length;
        }).length
      ) {
        nv.utils.noData(chart, container);
        return chart;
      } else {
        container.selectAll('.nv-noData').remove();
      }

      // Setup Scales
      x = lines.xScale();
      y = lines.yScale();

      // Setup containers and skeleton of chart
      var wrap = container.selectAll('g.nv-wrap.nv-lineChart').data([data]);
      var gEnter = wrap
        .enter()
        .append('g')
        .attr('class', 'nvd3 nv-wrap nv-lineChart')
        .append('g');
      var g = wrap.select('g');

      gEnter.append('g').attr('class', 'nv-legendWrap');

      var focusEnter = gEnter.append('g').attr('class', 'nv-focus');
      focusEnter
        .append('g')
        .attr('class', 'nv-background')
        .append('rect');
      focusEnter.append('g').attr('class', 'nv-x nv-axis');
      focusEnter.append('g').attr('class', 'nv-y nv-axis');
      focusEnter.append('g').attr('class', 'nv-linesWrap');
      focusEnter.append('g').attr('class', 'nv-interactive');

      var contextEnter = gEnter.append('g').attr('class', 'nv-context');
      contextEnter
        .append('g')
        .attr('class', 'nv-background')
        .append('rect');
      contextEnter.append('g').attr('class', 'nv-x nv-axis');
      contextEnter.append('g').attr('class', 'nv-y nv-axis');
      contextEnter.append('g').attr('class', 'nv-linesWrap');
      contextEnter.append('g').attr('class', 'nv-brushBackground');
      contextEnter.append('g').attr('class', 'nv-x nv-brush');

      wrap.attr(
        'transform',
        'translate(' + margin.left + ',' + margin.top + ')',
      );

      if (rightAlignYAxis) {
        g
          .select('.nv-y.nv-axis')
          .attr('transform', 'translate(' + availableWidth + ',0)');
      }

      //Set up interactive layer

      interactiveLayer
        .width(availableWidth)
        .height(availableHeight1)
        .margin({ left: margin.left, top: margin.top })
        .svgContainer(container)
        .xScale(x);
      wrap.select('.nv-interactive').call(interactiveLayer);

      g
        .select('.nv-focus .nv-background rect')
        .attr('width', availableWidth)
        .attr('height', availableHeight1);

      lines
        .width(availableWidth)
        .height(availableHeight1)
        .color(
          data.map(function(d, i) {
            return d.color || color(d, i);
          }),
        );

      var linesWrap = g.select('.nv-linesWrap').datum(data);

      // Setup Main (Focus) Axes
      xAxis
        .scale(x)
        ._ticks(nv.utils.calcTicksX(availableWidth / 100, data))
        .tickSize(-availableHeight1, 0);

      yAxis
        .scale(y)
        ._ticks(nv.utils.calcTicksY(availableHeight1 / 36, data))
        .tickSize(-availableWidth, 0);

      //============================================================
      // Update Axes
      //============================================================

      g
        .select('.nv-focus .nv-x.nv-axis')
        .attr('transform', 'translate(0,' + availableHeight1 + ')');

      linesWrap.call(lines);
      g
        .select('.nv-focus .nv-x.nv-axis')
        .transition()
        .duration(duration)
        .call(xAxis);
      g
        .select('.nv-focus .nv-y.nv-axis')
        .transition()
        .duration(duration)
        .call(yAxis);

      //============================================================
      // Event Handling/Dispatching (in chart's scope)
      //------------------------------------------------------------

      interactiveLayer.dispatch.on('elementMousemove', function(e) {
        lines.clearHighlights();
        var singlePoint,
          pointIndex,
          pointXLocation,
          allData = [];
        data.forEach(function(series, i) {
          var extent = x.domain();
          var currentValues = series.values.filter(function(d, i) {
            return lines.x()(d, i) >= extent[0] && lines.x()(d, i) <= extent[1];
          });

          pointIndex = nv.interactiveBisect(
            currentValues,
            e.pointXValue,
            lines.x(),
          );
          var point = currentValues[pointIndex];
          var pointYValue = chart.y()(point, pointIndex);
          if (pointYValue !== null) {
            lines.highlightPoint(series.seriesIndex, pointIndex, true);
          }
          if (point === undefined) return;
          if (singlePoint === undefined) singlePoint = point;
          if (pointXLocation === undefined)
            pointXLocation = chart.xScale()(chart.x()(point, pointIndex));
          allData.push({
            key: series.key,
            value: pointYValue,
            color: color(series, series.seriesIndex),
            data: point,
          });
        });
        //Highlight the tooltip entry based on which point the mouse is closest to.
        if (allData.length > 2) {
          var yValue = chart.yScale().invert(e.mouseY);
          var domainExtent = Math.abs(
            chart.yScale().domain()[0] - chart.yScale().domain()[1],
          );
          var threshold = 0.03 * domainExtent;
          var indexToHighlight = nv.nearestValueIndex(
            allData.map(d => d.value),
            yValue,
            threshold,
          );
          if (indexToHighlight !== null)
            allData[indexToHighlight].highlight = true;
        }

        interactiveLayer.renderGuideLine(pointXLocation);
      });

      interactiveLayer.dispatch.on('elementClick', function(e) {
        var pointXLocation,
          allData = [];

        data.forEach(function(series, i) {
          series.seriesIndex = i;
          var pointIndex = nv.interactiveBisect(
            series.values,
            e.pointXValue,
            chart.x(),
          );
          var point = series.values[pointIndex];
          if (typeof point === 'undefined') return;
          if (typeof pointXLocation === 'undefined')
            pointXLocation = chart.xScale()(chart.x()(point, pointIndex));
          var yPos = chart.yScale()(chart.y()(point, pointIndex));
          allData.push({
            point: point,
            pointIndex: pointIndex,
            pos: [pointXLocation, yPos],
            seriesIndex: series.seriesIndex,
            series: series,
          });
        });

        lines.dispatch.elementClick(allData);
      });

      interactiveLayer.dispatch.on('elementMouseout', function(e) {
        lines.clearHighlights();
      });
    });

    return chart;
  }

  //============================================================
  // Expose Public Variables
  //------------------------------------------------------------

  // expose chart's sub-components
  chart.dispatch = dispatch;
  chart.lines = lines;
  chart.xAxis = xAxis;
  chart.yAxis = yAxis;
  chart.interactiveLayer = interactiveLayer;
  chart.dispatch = dispatch;
  chart.options = nv.utils.optionsFunc.bind(chart);

  chart._options = Object.create(
    {},
    {
      // options that require extra logic in the setter
      margin: {
        get: function() {
          return margin;
        },
        set: function(_) {
          margin.top = _.top !== undefined ? _.top : margin.top;
          margin.right = _.right !== undefined ? _.right : margin.right;
          margin.bottom = _.bottom !== undefined ? _.bottom : margin.bottom;
          margin.left = _.left !== undefined ? _.left : margin.left;
        },
      },
      color: {
        get: function() {
          return color;
        },
        set: function(_) {
          color = nv.utils.getColor(_);
          lines.color(color);
        },
      },
    },
  );

  nv.utils.inheritOptions(chart, lines);
  nv.utils.initOptions(chart);

  chart.xScale(d3.time.scale());

  return chart;
}
