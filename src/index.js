'use strict';

import 'whatwg-fetch';
import 'babelify/polyfill';
import _ from 'lodash';
import Vue from 'vue';
import { format as formatDate } from 'date-fns';

window._ = _;

import router from './router.js';

Vue.config.debug = true;

var {default: packageInput, packages} = require('./packages/packages.js');

Vue.filter('formatDate', function (date, format) {
  return formatDate(date, format);
});

const App = Vue.extend({});

router.start(App, 'body');