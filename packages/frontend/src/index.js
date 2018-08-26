import 'whatwg-fetch';
import '@babel/polyfill';
import Vue from 'vue';
import { format as formatDate } from 'date-fns';
import router from './router.js';

Vue.config.debug = true;

Vue.filter('formatDate', function(date, format) {
  return formatDate(date, format);
});

const App = Vue.extend({});

router.start(App, 'body');
