import Vue from 'vue';
import VueRouter from 'vue-router';

Vue.use(VueRouter);

export const routes = [
  { path: '/', component: require('./home/home').default },
  { path: '/compare', component: require('./home/home').default },
  { path: '/compare/:packages+', component: require('./home/home').default },
];

export default new VueRouter({
  mode: 'history',
  routes,
});
