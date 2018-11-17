import 'whatwg-fetch';
import '@babel/polyfill';
import Fragment from 'vue-fragment';

import Vue from 'vue';
import { format as formatDate } from 'date-fns';
import router from './router.js';

Vue.use(Fragment.Plugin);

Vue.filter('formatDate', function(date, format) {
  return formatDate(date, format);
});

new Vue({
  el: '#root',
  router,
});
