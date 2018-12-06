import Vue from 'vue';
import { configure } from '@storybook/vue';


import { format as formatDate } from 'date-fns';

import '../src/style.styl';

Vue.filter('formatDate', function(date, format) {
  return formatDate(date, format);
});

// automatically import all files ending in *.stories.js
const req = require.context('../src', true, /.stories.js$/);
function loadStories() {
  req.keys().forEach(filename => req(filename));
}

configure(loadStories, module);
