import Vue from 'vue';
global.Vue = Vue;

import VueRouter from 'vue-router';
Vue.use(VueRouter);

const router = module.exports = new VueRouter();

router.map({
  '/': {
    component: require('./home/home.js')
  },
  '/compare/:packages': {
    component: require('./home/home.js')
  }
});

router.alias({'/compare': '/'})

// for debugging
window.router = router;