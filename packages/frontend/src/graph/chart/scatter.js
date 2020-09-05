import nv from 'nvd3';
import d3 from 'd3';

/* eslint-disable prettier/prettier */
export const scatter = function() {
  //============================================================
  // Public Variables with Default Settings
  //------------------------------------------------------------

  var margin         = {top: 0, right: 0, bottom: 0, left: 0}
      , width        = null
      , height       = null
      , color        = nv.utils.defaultColor() // chooses color
      , id           = Math.floor(Math.random() * 100000) //Create semi-unique ID incase user doesn't select one
      , container    = null
      , x            = d3.scale.linear()
      , y            = d3.scale.linear()
      , z            = d3.scale.linear() //linear because d3.svg.shape.size is treated as area
      , getX         = d => d.x // accessor to get the x value
      , getY         = d => d.y  // accessor to get the y value
      , getSize      = d => d.size || 1 // accessor to get the point size
        //   ['circle', 'cross', 'triangle-up', 'triangle-down', 'diamond', 'square'],
      , getShape     = d => d.shape || 'circle'  // accessor to get point shape
      , forceX       = [] // List of numbers to Force into the X scale (ie. 0, or a max / min, etc.)
      , forceY       = [] // List of numbers to Force into the Y scale
      , forceSize    = [] // List of numbers to Force into the Size scale
      , interactive  = true // If true, plots a voronoi overlay for advanced point intersection
      , padData      = false // If true, adds half a data points width to front and back, for lining up a line chart with a bar chart
      , padDataOuter = .1 //outerPadding to imitate ordinal scale outer padding
      , clipEdge     = false // if true, masks points within x and y scale
      , clipRadius   = () => 25 // function to get the radius for voronoi point clips
      , xDomain      = null // Override x domain (skips the calculation from data)
      , yDomain      = null // Override y domain
      , xRange       = null // Override x range
      , yRange       = null // Override y range
      , sizeDomain   = null // Override point size domain
      , sizeRange    = null
      , singlePoint  = false
      , dispatch     = d3.dispatch('elementClick', 'elementDblClick', 'elementMouseover', 'elementMouseout', 'renderEnd')
      , duration     = 250
      , interactiveUpdateDelay = 300
      ;


  //============================================================
  // Private Variables
  //------------------------------------------------------------

  var x0, y0, z0 // used to store previous scales
      , timeoutID
      , needsUpdate = false // Flag for when the points are visually updating, but the interactive layer is behind, to disable tooltips
      , _sizeRange_def = [16, 256]
      , _caches
      ;

  function getCache(d) {
      var cache, i;
      cache = _caches = _caches || {};
      i = d[0].series;
      cache = cache[i] = cache[i] || {};
      i = d[1];
      cache = cache[i] = cache[i] || {};
      return cache;
  }

  function getDiffs(d) {
      var i, key,
          point = d[0],
          cache = getCache(d),
          diffs = false;
      for (i = 1; i < arguments.length; i ++) {
          key = arguments[i];
          if (cache[key] !== point[key] || !cache.hasOwnProperty(key)) {
              cache[key] = point[key];
              diffs = true;
          }
      }
      return diffs;
  }

  function chart(selection) {
      selection.each(function(data) {
          container = d3.select(this);
          var availableWidth = nv.utils.availableWidth(width, container, margin),
              availableHeight = nv.utils.availableHeight(height, container, margin);

          nv.utils.initSVG(container);

          //add series index to each data point for reference
          data.forEach((series, i) => {
              series.values.forEach((point) => {
                  point.series = i;
              });
          });

          // Setup Scales
          var logScale = chart.yScale().toString().includes('log(x)')
          // remap and flatten the data for use in calculating the scales' domains
          var seriesData = (xDomain && yDomain && sizeDomain) ? [] : // if we know xDomain and yDomain and sizeDomain, no need to calculate.... if Size is constant remember to set sizeDomain to speed up performance
              d3.merge(
                  data.map(d => d.values.map((d,i) => ({ x: getX(d,i), y: getY(d,i), size: getSize(d,i) })))
              );

          x   .domain(xDomain || d3.extent(seriesData.map(d => d.x).concat(forceX)))

          if (padData && data[0])
              x.range(xRange || [(availableWidth * padDataOuter +  availableWidth) / (2 *data[0].values.length), availableWidth - availableWidth * (1 + padDataOuter) / (2 * data[0].values.length)  ]);
          //x.range([availableWidth * .5 / data[0].values.length, availableWidth * (data[0].values.length - .5)  / data[0].values.length ]);
          else
              x.range(xRange || [0, availableWidth]);


           var min = d3.min(seriesData.map(d => d.y || null));
           var max = d3.max(seriesData.map(d => d.y));
           if (logScale) {
                  y.clamp(true)
                      .domain(yDomain || [min || 0, max * 1.01])
                      .range(yRange || [availableHeight, 0]);
              } else {
                      y.domain(yDomain || [min || 0, max * 1.01])
                      .range(yRange || [availableHeight, 0]);
              }

          z   .domain(sizeDomain || d3.extent(seriesData.map(d => d.size).concat(forceSize)))
              .range(sizeRange || _sizeRange_def);

          // If scale's domain don't have a range, slightly adjust to make one... so a chart can show a single data point
          singlePoint = x.domain()[0] === x.domain()[1] || y.domain()[0] === y.domain()[1];

          if (x.domain()[0] === x.domain()[1])
              x.domain()[0] ?
                  x.domain([x.domain()[0] - x.domain()[0] * 0.01, x.domain()[1] + x.domain()[1] * 0.01])
                  : x.domain([-1,1]);

          if (y.domain()[0] === y.domain()[1])
              y.domain()[0] ?
                  y.domain([y.domain()[0] - y.domain()[0] * 0.01, y.domain()[1] + y.domain()[1] * 0.01])
                  : y.domain([-1,1]);

          if ( isNaN(x.domain()[0])) {
              x.domain([-1,1]);
          }

          if ( isNaN(y.domain()[0])) {
              y.domain([-1,1]);
          }

          x0 = x0 || x;
          y0 = y0 || y;
          z0 = z0 || z;

          var scaleDiff = x(1) !== x0(1) || y(1) !== y0(1) || z(1) !== z0(1);

          // Setup containers and skeleton of chart
          var wrap = container.selectAll('g.nv-wrap.nv-scatter').data([data]);
          var wrapEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-scatter nv-chart-' + id);
          var defsEnter = wrapEnter.append('defs');
          var gEnter = wrapEnter.append('g');
          var g = wrap.select('g');

          wrap.classed('nv-single-point', singlePoint);
          gEnter.append('g').attr('class', 'nv-groups');
          gEnter.append('g').attr('class', 'nv-point-paths');
          wrapEnter.append('g').attr('class', 'nv-point-clips');

          wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

          defsEnter.append('clipPath')
              .attr('id', 'nv-edge-clip-' + id)
              .append('rect');

          wrap.select('#nv-edge-clip-' + id + ' rect')
              .attr('width', availableWidth)
              .attr('height', (availableHeight > 0) ? availableHeight : 0);

          g.attr('clip-path', clipEdge ? 'url(#nv-edge-clip-' + id + ')' : '');

          function updateInteractiveLayer() {
              // Always clear needs-update flag regardless of whether or not
              // we will actually do anything (avoids needless invocations).
              needsUpdate = false;

              if (!interactive) return false;

              // inject series and point index for reference into voronoi
          
              // add event handlers to points instead voronoi paths
              wrap.select('.nv-groups').selectAll('.nv-group')
                  .selectAll('.nv-point')
                  .on('click', function(d,i) {
                      //nv.log('test', d, i);
                      if (needsUpdate || !data[d.series]) return 0; //check if this is a dummy point
                      var series = data[d.series],
                          point  = series.values[i];

                      dispatch.elementClick({
                          point: point,
                          series: series,
                          pos: [x(getX(point, i)) + margin.left, y(getY(point, i)) + margin.top], //TODO: make this pos base on the page
                          relativePos: [x(getX(point, i)) + margin.left, y(getY(point, i)) + margin.top],
                          seriesIndex: d.series,
                          pointIndex: i
                      });
                  })
                  .on('mouseover', function(d,i) {
                      if (needsUpdate || !data[d.series]) return 0; //check if this is a dummy point
                      var series = data[d.series],
                          point  = series.values[i];

                      dispatch.elementMouseover({
                          point: point,
                          series: series,
                          pos: [x(getX(point, i)) + margin.left, y(getY(point, i)) + margin.top],//TODO: make this pos base on the page
                          relativePos: [x(getX(point, i)) + margin.left, y(getY(point, i)) + margin.top],
                          seriesIndex: d.series,
                          pointIndex: i,
                          color: color(d, i)
                      });
                  })
                  .on('mouseout', function(d,i) {
                      if (needsUpdate || !data[d.series]) return 0; //check if this is a dummy point
                      var series = data[d.series],
                          point  = series.values[i];

                      dispatch.elementMouseout({
                          point: point,
                          series: series,
                          pos: [x(getX(point, i)) + margin.left, y(getY(point, i)) + margin.top],//TODO: make this pos base on the page
                          relativePos: [x(getX(point, i)) + margin.left, y(getY(point, i)) + margin.top],
                          seriesIndex: d.series,
                          pointIndex: i,
                          color: color(d, i)
                      });
                  });
              
          }

          needsUpdate = true;
          var groups = wrap.select('.nv-groups').selectAll('.nv-group')
              .data(d => d, d => d.key);
          groups.enter().append('g')
              .style('stroke-opacity', 1e-6)
              .style('fill-opacity', 1e-6);
          groups.exit()
              .remove();
          groups
              .attr('class', (d, i) => (d.classed || '') + ' nv-group nv-series-' + i)
              .classed('nv-noninteractive', !interactive)
              .classed('hover', (d) => d.hover )
              .style('fill', (d, i) => color(d, i) )
              .style('stroke', (d, i) =>  color(d, i) )
              .style('stroke-opacity', 1)
              .style('fill-opacity', .5);

          // create the points, maintaining their IDs from the original data set
          var points = groups.selectAll('g.nv-point')
              .data((d) => d.values
                .map((point, pointIndex) => [point, pointIndex])
              );
          points.enter()
              .append('g')
                .attr('class', d => 'nv-point nv-point-' + d[1])
                .style('fill', d => d.color)
                .style('stroke', d => d.color)
                .attr('transform', d => {
                    const translateX = nv.utils.NaNtoZero(x0(getX(d[0],d[1])));
                    const translateY = nv.utils.NaNtoZero(y0(getY(d[0],d[1])));
                    const translate = 'translate(' + translateX + ',' + translateY + ')';
                    return translate;
                })
                .attr('releases', d => (d[0].releases))
                .append('text')
                    .text(d => d[0].releases.join(', '))
                    .attr('text-anchor', 'middle')
                    .attr('y', d => {
                      const yValue = y0(getY(d[0],d[1]));
                      const yPercent = yValue / y.range()[0]
                      // this is flipped from intuition; high yPercent means lower on screen
                      if (yPercent > 0.9) return -16
                      return 16
                    })

          points.exit().remove();
          groups.exit().selectAll('g.nv-point')
              .attr('transform', d => 'translate(' + nv.utils.NaNtoZero(x(getX(d[0],d[1]))) + ',' + nv.utils.NaNtoZero(y(getY(d[0],d[1]))) + ')')
              .remove();
          points.filter(d => scaleDiff || getDiffs(d, 'x', 'y'))
              .attr('transform', d => 'translate(' + nv.utils.NaNtoZero(x(getX(d[0],d[1]))) + ',' + nv.utils.NaNtoZero(y(getY(d[0],d[1]))) + ')');
          points.filter(d => scaleDiff || getDiffs(d, 'shape', 'size'))
              .append('path')
              .attr('d',
                  nv.utils.symbol()
                  .type(d => {
                      return d[0].releases.length > 0 ? 'cross' : 'circle'
                    })
                  .size(d => {
                      return d[0].releases.length > 0 ? z(getSize(d[0],d[1]) * 2) : z(getSize(d[0],d[1]))
                  })
          );
          
          // Delay updating the invisible interactive layer for smoother animation
          if( interactiveUpdateDelay ) {
              clearTimeout(timeoutID); // stop repeat calls to updateInteractiveLayer
              timeoutID = setTimeout(updateInteractiveLayer, interactiveUpdateDelay );
          }
          else {
              updateInteractiveLayer();
          }

          //store old scales for use in transitions on update
          x0 = x.copy();
          y0 = y.copy();
          z0 = z.copy();

      });
      return chart;
  }

  //============================================================
  // Expose Public Variables
  //------------------------------------------------------------

  chart.dispatch = dispatch;
  chart.options = nv.utils.optionsFunc.bind(chart);

  // utility function calls provided by this chart
  chart._calls = new function() {
      this.clearHighlights = function () {
          nv.dom.write(() => container.selectAll(".nv-point.hover").classed("hover", false));
          return null;
      };
      this.highlightPoint = function (seriesIndex, pointIndex, isHoverOver) {
          nv.dom.write(() => container.select('.nv-groups')
            .selectAll(".nv-series-" + seriesIndex)
            .selectAll(".nv-point-" + pointIndex)
            .classed("hover", isHoverOver)
          );
      };
  };

  // trigger calls from events too
  dispatch.on('elementMouseover.point', function(d) {
      if (interactive) chart._calls.highlightPoint(d.seriesIndex,d.pointIndex,true);
  });

  dispatch.on('elementMouseout.point', function(d) {
      if (interactive) chart._calls.highlightPoint(d.seriesIndex,d.pointIndex,false);
  });

  chart._options = Object.create({}, {
      // simple options, just get/set the necessary values
      width:        {get: function(){return width;}, set: function(_){width=_;}},
      height:       {get: function(){return height;}, set: function(_){height=_;}},
      xScale:       {get: function(){return x;}, set: function(_){x=_;}},
      yScale:       {get: function(){return y;}, set: function(_){y=_;}},
      pointScale:   {get: function(){return z;}, set: function(_){z=_;}},
      xDomain:      {get: function(){return xDomain;}, set: function(_){xDomain=_;}},
      yDomain:      {get: function(){return yDomain;}, set: function(_){yDomain=_;}},
      pointDomain:  {get: function(){return sizeDomain;}, set: function(_){sizeDomain=_;}},
      xRange:       {get: function(){return xRange;}, set: function(_){xRange=_;}},
      yRange:       {get: function(){return yRange;}, set: function(_){yRange=_;}},
      pointRange:   {get: function(){return sizeRange;}, set: function(_){sizeRange=_;}},
      forceX:       {get: function(){return forceX;}, set: function(_){forceX=_;}},
      forceY:       {get: function(){return forceY;}, set: function(_){forceY=_;}},
      forcePoint:   {get: function(){return forceSize;}, set: function(_){forceSize=_;}},
      interactive:  {get: function(){return interactive;}, set: function(_){interactive=_;}},
      padDataOuter: {get: function(){return padDataOuter;}, set: function(_){padDataOuter=_;}},
      padData:      {get: function(){return padData;}, set: function(_){padData=_;}},
      clipEdge:     {get: function(){return clipEdge;}, set: function(_){clipEdge=_;}},
      clipRadius:   {get: function(){return clipRadius;}, set: function(_){clipRadius=_;}},
      id:           {get: function(){return id;}, set: function(_){id=_;}},
      interactiveUpdateDelay: {get:function(){return interactiveUpdateDelay;}, set: function(_){interactiveUpdateDelay=_;}},

      // simple functor options
      x:     {get: function(){return getX;}, set: function(_){getX = d3.functor(_);}},
      y:     {get: function(){return getY;}, set: function(_){getY = d3.functor(_);}},
      pointSize: {get: function(){return getSize;}, set: function(_){getSize = d3.functor(_);}},
      pointShape: {get: function(){return getShape;}, set: function(_){getShape = d3.functor(_);}},

      // options that require extra logic in the setter
      margin: {get: function(){return margin;}, set: function(_){
          margin.top    = _.top    !== undefined ? _.top    : margin.top;
          margin.right  = _.right  !== undefined ? _.right  : margin.right;
          margin.bottom = _.bottom !== undefined ? _.bottom : margin.bottom;
          margin.left   = _.left   !== undefined ? _.left   : margin.left;
      }},
      duration: {get: function(){return duration;}, set: function(_){
          duration = _;
      }},
      color: {get: function(){return color;}, set: function(_){
          color = nv.utils.getColor(_);
      }},
  });

  nv.utils.initOptions(chart);
  return chart;
};
