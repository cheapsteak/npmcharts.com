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
      , getShape     = d => d.shape || 'circle'  // accessor to get point shape
      , forceX       = [] // List of numbers to Force into the X scale (ie. 0, or a max / min, etc.)
      , forceY       = [] // List of numbers to Force into the Y scale
      , forceSize    = [] // List of numbers to Force into the Size scale
      , interactive  = true // If true, plots a voronoi overlay for advanced point intersection
      , pointActive  = d => !d.notActive  // any points that return false will be filtered out
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
      ;


  //============================================================
  // Private Variables
  //------------------------------------------------------------

  var _sizeRange_def = [16, 256]
      ;

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

          // remap and flatten the data for use in calculating the scales' domains
          var seriesData = (xDomain && yDomain && sizeDomain) ? [] : // if we know xDomain and yDomain and sizeDomain, no need to calculate.... if Size is constant remember to set sizeDomain to speed up performance
              d3.merge(
                  data.map(d => d.values.map((d,i) => ({ x: getX(d,i), y: getY(d,i), size: getSize(d,i) })))
              );

          x   .domain(xDomain || d3.extent(seriesData.map(d => d.x).concat(forceX)))

          if (padData && data[0])
              x.range(xRange || [(availableWidth * padDataOuter +  availableWidth) / (2 *data[0].values.length), availableWidth - availableWidth * (1 + padDataOuter) / (2 * data[0].values.length)  ]);
          else
              x.range(xRange || [0, availableWidth]);

           // Setup Scales
           var logScale = chart.yScale().name === d3.scale.log().name ? true : false; 
           if (logScale) {
                  var min = d3.min(seriesData.map(function(d) { if (d.y !== 0) return d.y; }));
                  y.clamp(true)
                      .domain(yDomain || d3.extent(seriesData.map(function(d) {
                          if (d.y !== 0) return d.y;
                          else return min * 0.1;
                      }).concat(forceY)))
                      .range(yRange || [availableHeight, 0]);
              } else {
                      y.domain(yDomain || d3.extent(seriesData.map(d => d.y).concat(forceY)))
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
          var points = groups.selectAll('path.nv-point')
              .data((d) => d.values
                .map((point, pointIndex) => [point, pointIndex])
                .filter((pointArray, pointIndex) => pointActive(pointArray[0], pointIndex))
              );
          points.enter().append('path')
              .attr('class', d => 'nv-point nv-point-' + d[1])
              .style('fill', d => d.color)
              .style('stroke', d => d.color)
              .attr('transform', d => 'translate(' + nv.utils.NaNtoZero(x(getX(d[0],d[1]))) + ',' + nv.utils.NaNtoZero(y(getY(d[0],d[1]))) + ')')
              .attr('d',
                  nv.utils.symbol()
                  .type(d => getShape(d[0]))
                  .size(d => z(getSize(d[0],d[1])))
              );

          // XXX: this code doesn't seem to do anything?
          // points.exit().remove();
          // groups.exit().selectAll('path.nv-point')
          //     .attr('transform', d => 'translate(' + nv.utils.NaNtoZero(x(getX(d[0],d[1]))) + ',' + nv.utils.NaNtoZero(y(getY(d[0],d[1]))) + ')')
          //     .remove();
          // points.filter(d => getDiffs(d, 'x', 'y'))
          //     .attr('transform', d => 'translate(' + nv.utils.NaNtoZero(x(getX(d[0],d[1]))) + ',' + nv.utils.NaNtoZero(y(getY(d[0],d[1]))) + ')');
          // points.filter(d => getDiffs(d, 'shape', 'size'))
          //     .attr('d',
          //         nv.utils.symbol()
          //         .type(d => getShape(d[0]))
          //         .size(d => z(getSize(d[0],d[1])))
          // );
        

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
      pointActive:  {get: function(){return pointActive;}, set: function(_){pointActive=_;}},
      padDataOuter: {get: function(){return padDataOuter;}, set: function(_){padDataOuter=_;}},
      padData:      {get: function(){return padData;}, set: function(_){padData=_;}},
      clipEdge:     {get: function(){return clipEdge;}, set: function(_){clipEdge=_;}},
      clipRadius:   {get: function(){return clipRadius;}, set: function(_){clipRadius=_;}},
      id:           {get: function(){return id;}, set: function(_){id=_;}},

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
