'use strict';

import 'whatwg-fetch';
import 'babel/polyfill';
import _ from 'lodash';
import Vue from 'vue';
import moment from 'moment';

window._ = _;

import router from './router.js';

Vue.config.debug = true;

var {default: packageInput, packages} = require('./packages/packages.js');

Vue.filter('formatDate', function (date, format) {
  return moment(date).format(format);
});

const App = Vue.extend({});

router.start(App, 'body');