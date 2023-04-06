import { useState, useEffect, useRef } from 'react';
import d3 from 'd3';
import nv from 'nvd3';
import _ from 'lodash';
import { format as formatDate, startOfDay } from 'date-fns';
import { line, curveCatmullRom } from 'd3-shape';
import { lineChart, xAccessor } from './chart/lineChart';

const { palette } = require('configs');

const formatLogTick = function(n) {
  const log = Math.log(n) / Math.LN10;
  if (Math.abs(Math.round(log) - log) < 1e-6) {
    if (n < 1e3) return n;
    if (n >= 1e3 && n < 1e6) return +(n / 1e3).toFixed(1) + 'K';
    if (n >= 1e6 && n < 1e9) return +(n / 1e6).toFixed(1) + 'M';
    if (n >= 1e9 && n < 1e12) return +(n / 1e9).toFixed(1) + 'B';
    if (n >= 1e12) return +(n / 1e12).toFixed(1) + 'T';
  } else {
    return '';
  }
};

const catmulRomInterpolation = (points, tension) =>
  line()
    .curve(curveCatmullRom)(points)
    .replace(/^M/, '');

function processEntries(entries, { interval = 7 }) {
  if (interval !== 1) {
    entries = _.flow([
      entries =>
        _.groupBy(entries, entry =>
          Math.floor((entries.length - entries.indexOf(entry) - 1) / interval),
        ),
      _.values,
      entries =>
        entries.map(entriesInGroup => ({
          count: _.sumBy(entriesInGroup, entry => entry.count),
          day: entriesInGroup[0].day,
          releases: entriesInGroup.flatMap(entry => entry.releases),
        })),
      /*
        x axis entries need to be in ascending order
        finding the point to highlight relies on nv.interactiveBisect
        (used in lineChart.js on "elementMousemove")
        which "Will not work if the data points move backwards
      */
      _.reverse,
    ])(entries);
  }

  return entries;
}

const processEntriesMemo = _.memoize(processEntries, (...args) => {
  return JSON.stringify(args);
});

function getStartOfPeriod({
  date,
  processedData,
  packageDownloadStats,
  interval,
}) {
  const indexInPackageDownloadStats = _.findIndex(
    packageDownloadStats[0].entries,
    entry => entry.day.getTime() === startOfDay(date).getTime(),
  );

  const startOfPeriodBucket = Math.floor(
    (packageDownloadStats[0].entries.length - indexInPackageDownloadStats) /
      interval,
  );

  return processedData[0].values[
    Math.max(0, processedData[0].values.length - startOfPeriodBucket)
  ].day;
}

function getDataAtDate({
  date,
  processedData,
  packageDownloadStats,
  interval,
}) {
  const modules = processedData;

  const startOfPeriod = getStartOfPeriod({
    date,
    processedData: modules,
    packageDownloadStats: packageDownloadStats,
    interval: interval,
  });

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
}

function processForD3({ downloadStats, interval, showWeekends }) {
  return downloadStats.map(({ name, entries }) => ({
    key: name,
    values: processEntriesMemo(
      entries,
      {
        interval: interval,
      },
      [name, showWeekends, interval].join(','),
    ),
  }));
}

export const Graph = ({
  moduleNames,
  packageDownloadStats,
  interval,
  shouldUseLogScale,
}) => {
  const processedData = processForD3({
    downloadStats: packageDownloadStats,
    interval,
    showWeekends: false,
  });
  const seriesWithMostDataPoints = _.sortBy(
    processedData,
    series => series.values.length,
  )[processedData.length - 1];

  const [legendData, setLegendData] = useState<{
    date: Date;
    modules: Array<{ color: string; name: string; downloads: number }>;
  }>();

  const margin = {
    top: 0,
    right: 36,
    bottom: 30,
    left: 16,
  };

  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const chart = lineChart();

    chart.margin(margin).color(palette);

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
      .tickFormat(shouldUseLogScale ? formatLogTick : d3.format('s'));

    const interpolation = interval > 1 ? catmulRomInterpolation : 'linear';

    chart.interpolate(interpolation);

    chart.yScale(shouldUseLogScale ? d3.scale.log() : d3.scale.linear());
    chart.useLogScale(shouldUseLogScale);
    svg.data([processedData]).call(chart);

    // Update legend on mousemove
    var prevMousemove = chart.interactiveLayer.dispatch.on('elementMousemove');

    chart.interactiveLayer.dispatch.on('elementMousemove', e => {
      prevMousemove.call(chart.interactiveLayer, e);
      const date = e.pointXValue;
      try {
        const nearestPointIndex = nv.interactiveBisect(
          seriesWithMostDataPoints.values,
          date,
          xAccessor,
        );
        const point = seriesWithMostDataPoints.values[nearestPointIndex];
        setLegendData(
          getDataAtDate({
            date: xAccessor(point),
            processedData,
            packageDownloadStats,
            interval,
          }),
        );
      } catch (e) {
        console.warn(`error retrieving data for ${date}`);
      }
    });

    // Reset legend data to current date's when mouse leaves interactiveLayer
    var prevMouseout = chart.interactiveLayer.dispatch.on('elementMouseout');
    chart.interactiveLayer.dispatch.on('elementMouseout', e => {
      prevMouseout.call(chart.interactiveLayer, e);
      setLegendData(
        getDataAtDate({
          date: chart.xAxis.domain()[1],
          processedData,
          packageDownloadStats,
          interval,
        }),
      );
    });

    setLegendData(
      getDataAtDate({
        date: chart.xAxis.domain()[1],
        processedData,
        packageDownloadStats,
        interval,
      }),
    );

    return () => {
      chart.interactiveLayer.dispatch.on('elementMousemove', null);
      chart.interactiveLayer.dispatch.on('elementMouseout', null);
    };
  }, [packageDownloadStats, interval, shouldUseLogScale]);

  if (typeof window !== 'undefined') {
    // @ts-expect-error Property '__currently_rendered_graph__' does not exist on type 'Window & typeof globalThis'.
    // signal for puppeteer to know when a new graph is rendered
    window.__currently_rendered_graph__ = moduleNames.join(',');
  }
  return (
    <div id="chart" className="with-3d-shadow with-transitions chart">
      <svg ref={svgRef}></svg>
    </div>
  );
};
