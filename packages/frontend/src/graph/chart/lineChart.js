import nv from 'nvd3';
import d3 from 'd3';

export function lineChart() {
  //============================================================
  // Public Variables with Default Settings
  //------------------------------------------------------------

  var lines = nv.models.line(),
    xAxis = nv.models.axis(),
    yAxis = nv.models.axis(),
    interactiveLayer = nv.interactiveGuideline(),
    x2Axis = nv.models.axis(),
    y2Axis = nv.models.axis();

  var margin = { top: 30, right: 20, bottom: 50, left: 60 },
    margin2 = { top: 0, right: 20, bottom: 20, left: 60 },
    color = nv.utils.defaultColor(),
    width = null,
    height = null,
    showLegend = true,
    legendPosition = 'top',
    showXAxis = true,
    showYAxis = true,
    rightAlignYAxis = false,
    useInteractiveGuideline = false,
    x,
    y,
    state = nv.utils.state(),
    defaultState = null,
    noData = null,
    dispatch = d3.dispatch('brush', 'stateChange', 'changeState', 'renderEnd'),
    duration = 250;

  // set options on sub-objects for this chart
  xAxis.orient('bottom').tickPadding(7);
  yAxis.orient(rightAlignYAxis ? 'right' : 'left');

  lines.clipEdge(true).duration(0);

  x2Axis.orient('bottom').tickPadding(5);
  y2Axis.orient(rightAlignYAxis ? 'right' : 'left');

  //============================================================
  // Private Variables
  //------------------------------------------------------------

  var renderWatch = nv.utils.renderWatch(dispatch, duration);

  var stateGetter = function(data) {
    return function() {
      return {
        active: data.map(function(d) {
          return !d.disabled;
        }),
      };
    };
  };

  var stateSetter = function(data) {
    return function(state) {
      if (state.active !== undefined)
        data.forEach(function(series, i) {
          series.disabled = !state.active[i];
        });
    };
  };

  function chart(selection) {
    renderWatch.reset();
    renderWatch.models(lines);
    if (showXAxis) renderWatch.models(xAxis);
    if (showYAxis) renderWatch.models(yAxis);

    selection.each(function(data) {
      var container = d3.select(this);
      nv.utils.initSVG(container);
      var availableWidth = nv.utils.availableWidth(width, container, margin),
        availableHeight1 =
          nv.utils.availableHeight(height, container, margin) - 0,
        availableHeight2 = 0 - margin2.top - margin2.bottom;

      chart.update = function() {
        if (duration === 0) {
          container.call(chart);
        } else {
          container
            .transition()
            .duration(duration)
            .call(chart);
        }
      };
      chart.container = this;

      state
        .setter(stateSetter(data), chart.update)
        .getter(stateGetter(data))
        .update();

      // DEPRECATED set state.disabled
      state.disabled = data.map(function(d) {
        return !!d.disabled;
      });

      if (!defaultState) {
        var key;
        defaultState = {};
        for (key in state) {
          if (state[key] instanceof Array)
            defaultState[key] = state[key].slice(0);
          else defaultState[key] = state[key];
        }
      }

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
      if (useInteractiveGuideline) {
        interactiveLayer
          .width(availableWidth)
          .height(availableHeight1)
          .margin({ left: margin.left, top: margin.top })
          .svgContainer(container)
          .xScale(x);
        wrap.select('.nv-interactive').call(interactiveLayer);
      }

      g
        .select('.nv-focus .nv-background rect')
        .attr('width', availableWidth)
        .attr('height', availableHeight1);

      lines
        .width(availableWidth)
        .height(availableHeight1)
        .color(
          data
            .map(function(d, i) {
              return d.color || color(d, i);
            })
            .filter(function(d, i) {
              return !data[i].disabled;
            }),
        );

      var linesWrap = g.select('.nv-linesWrap').datum(
        data.filter(function(d) {
          return !d.disabled;
        }),
      );

      // Setup Main (Focus) Axes
      if (showXAxis) {
        xAxis
          .scale(x)
          ._ticks(nv.utils.calcTicksX(availableWidth / 100, data))
          .tickSize(-availableHeight1, 0);
      }

      if (showYAxis) {
        yAxis
          .scale(y)
          ._ticks(nv.utils.calcTicksY(availableHeight1 / 36, data))
          .tickSize(-availableWidth, 0);
      }

      //============================================================
      // Update Axes
      //============================================================
      function updateXAxis() {
        if (showXAxis) {
          g
            .select('.nv-focus .nv-x.nv-axis')
            .transition()
            .duration(duration)
            .call(xAxis);
        }
      }

      function updateYAxis() {
        if (showYAxis) {
          g
            .select('.nv-focus .nv-y.nv-axis')
            .transition()
            .duration(duration)
            .call(yAxis);
        }
      }

      g
        .select('.nv-focus .nv-x.nv-axis')
        .attr('transform', 'translate(0,' + availableHeight1 + ')');

      linesWrap.call(lines);
      updateXAxis();
      updateYAxis();

      //============================================================
      // Event Handling/Dispatching (in chart's scope)
      //------------------------------------------------------------

      interactiveLayer.dispatch.on('elementMousemove', function(e) {
        lines.clearHighlights();
        var singlePoint,
          pointIndex,
          pointXLocation,
          allData = [];
        data
          .filter(function(series, i) {
            series.seriesIndex = i;
            return !series.disabled && !series.disableTooltip;
          })
          .forEach(function(series, i) {
            var extent = x.domain();
            var currentValues = series.values.filter(function(d, i) {
              return (
                lines.x()(d, i) >= extent[0] && lines.x()(d, i) <= extent[1]
              );
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
            allData.map(function(d) {
              return d.value;
            }),
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

        data
          .filter(function(series, i) {
            series.seriesIndex = i;
            return !series.disabled;
          })
          .forEach(function(series) {
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

      dispatch.on('changeState', function(e) {
        if (
          typeof e.disabled !== 'undefined' &&
          data.length === e.disabled.length
        ) {
          data.forEach(function(series, i) {
            series.disabled = e.disabled[i];
          });

          state.disabled = e.disabled;
        }

        chart.update();
      });

      //============================================================
      // Functions
      //------------------------------------------------------------

      // Taken from crossfilter (http://square.github.com/crossfilter/)
      function resizePath(d) {
        var e = +(d == 'e'),
          x = e ? 1 : -1,
          y = availableHeight2 / 3;
        return (
          'M' +
          0.5 * x +
          ',' +
          y +
          'A6,6 0 0 ' +
          e +
          ' ' +
          6.5 * x +
          ',' +
          (y + 6) +
          'V' +
          (2 * y - 6) +
          'A6,6 0 0 ' +
          e +
          ' ' +
          0.5 * x +
          ',' +
          2 * y +
          'Z' +
          'M' +
          2.5 * x +
          ',' +
          (y + 8) +
          'V' +
          (2 * y - 8) +
          'M' +
          4.5 * x +
          ',' +
          (y + 8) +
          'V' +
          (2 * y - 8)
        );
      }
    });

    renderWatch.renderEnd('lineChart immediate');
    return chart;
  }

  //============================================================
  // Expose Public Variables
  //------------------------------------------------------------

  // expose chart's sub-components
  chart.dispatch = dispatch;
  chart.lines = lines;
  chart.xAxis = xAxis;
  chart.x2Axis = x2Axis;
  chart.yAxis = yAxis;
  chart.y2Axis = y2Axis;
  chart.interactiveLayer = interactiveLayer;
  chart.state = state;
  chart.dispatch = dispatch;
  chart.options = nv.utils.optionsFunc.bind(chart);

  chart._options = Object.create(
    {},
    {
      // simple options, just get/set the necessary values
      width: {
        get: function() {
          return width;
        },
        set: function(_) {
          width = _;
        },
      },
      height: {
        get: function() {
          return height;
        },
        set: function(_) {
          height = _;
        },
      },
      showLegend: {
        get: function() {
          return showLegend;
        },
        set: function(_) {
          showLegend = _;
        },
      },
      legendPosition: {
        get: function() {
          return legendPosition;
        },
        set: function(_) {
          legendPosition = _;
        },
      },
      showXAxis: {
        get: function() {
          return showXAxis;
        },
        set: function(_) {
          showXAxis = _;
        },
      },
      showYAxis: {
        get: function() {
          return showYAxis;
        },
        set: function(_) {
          showYAxis = _;
        },
      },
      defaultState: {
        get: function() {
          return defaultState;
        },
        set: function(_) {
          defaultState = _;
        },
      },
      noData: {
        get: function() {
          return noData;
        },
        set: function(_) {
          noData = _;
        },
      },

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
      duration: {
        get: function() {
          return duration;
        },
        set: function(_) {
          duration = _;
          renderWatch.reset(duration);
          lines.duration(duration);
          xAxis.duration(duration);
          x2Axis.duration(duration);
          yAxis.duration(duration);
          y2Axis.duration(duration);
        },
      },
      focusMargin: {
        get: function() {
          return margin2;
        },
        set: function(_) {
          margin2.top = _.top !== undefined ? _.top : margin2.top;
          margin2.right = _.right !== undefined ? _.right : margin2.right;
          margin2.bottom = _.bottom !== undefined ? _.bottom : margin2.bottom;
          margin2.left = _.left !== undefined ? _.left : margin2.left;
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
      interpolate: {
        get: function() {
          return lines.interpolate();
        },
        set: function(_) {
          lines.interpolate(_);
        },
      },
      xTickFormat: {
        get: function() {
          return xAxis.tickFormat();
        },
        set: function(_) {
          xAxis.tickFormat(_);
          x2Axis.tickFormat(_);
        },
      },
      yTickFormat: {
        get: function() {
          return yAxis.tickFormat();
        },
        set: function(_) {
          yAxis.tickFormat(_);
          y2Axis.tickFormat(_);
        },
      },
      x: {
        get: function() {
          return lines.x();
        },
        set: function(_) {
          lines.x(_);
        },
      },
      y: {
        get: function() {
          return lines.y();
        },
        set: function(_) {
          lines.y(_);
        },
      },
      rightAlignYAxis: {
        get: function() {
          return rightAlignYAxis;
        },
        set: function(_) {
          rightAlignYAxis = _;
          yAxis.orient(rightAlignYAxis ? 'right' : 'left');
        },
      },
      useInteractiveGuideline: {
        get: function() {
          return useInteractiveGuideline;
        },
        set: function(_) {
          useInteractiveGuideline = _;
          if (useInteractiveGuideline) {
            lines.interactive(false);
            lines.useVoronoi(false);
          }
        },
      },
    },
  );

  nv.utils.inheritOptions(chart, lines);
  nv.utils.initOptions(chart);

  return chart;
}
