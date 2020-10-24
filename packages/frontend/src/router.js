import Vue from 'vue';
import VueRouter from 'vue-router';

Vue.use(VueRouter);

export const routes = [
  { path: '/', component: require('./components/home.vue').default },
  { path: '/compare', component: require('./components/home.vue').default },
  {
    path: '/compare/:packages+',
    component: require('./components/home.vue').default,
  },
];

export default new VueRouter({
  mode: 'history',
  routes,
});
