import Vue from 'vue';
import VueRouter from 'vue-router';

Vue.use(VueRouter);

const router = (module.exports = new VueRouter({ history: true }));

router.map({
  '/': {
    component: require('./home/home.js'),
  },
  '/compare': {
    component: require('./home/home.js'),
  },
  '/compare/*packages': {
    component: require('./home/home.js'),
  },
});
