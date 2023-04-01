import React from 'react';
import { createRoot } from 'react-dom/client';

import Vue from 'vue';
import { format as formatDate } from 'date-fns';
import Index from './index.vue';

Vue.filter('formatDate', function(date, format) {
  return formatDate(date, format);
});

const root = createRoot(document.getElementById('root'));
root.render(<Index />);
