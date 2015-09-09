'use strict';

import 'whatwg-fetch';
import 'babel/polyfill';
import _ from 'lodash';
window._ = _;

import npmData from './services/downloads.js';
import {graph, palette} from './graph/graph.js';

(async function () {
  const packages = location.hash.slice(1).split(',');
  const data = await (packages[0] ? npmData.fetch(...packages) : npmData.fetch('less', 'node-sass', 'stylus'));
  graph.render(data);
})()

window.d3 = d3;
window.chart = graph.chart;
window.graph = graph;