import 'whatwg-fetch';

import Vue from 'vue';
import { format as formatDate } from 'date-fns';
import router from './router.js';

Vue.filter('formatDate', function(date, format) {
  return formatDate(date, format);
});

new Vue({
  el: '#root',
  router,
  render(h) {
    return h('router-view', {
      key: this.$route.fullPath,
    });
  },
});
