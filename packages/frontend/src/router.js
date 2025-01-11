import Vue from 'vue';
import VueRouter from 'vue-router';
import Home from "./home/home.vue";

Vue.use(VueRouter);

export const routes = [
  { path: '/', component: Home },
  { path: '/compare', component: Home },
  { path: '/compare/:packages+', component: Home },
];

export default new VueRouter({
  mode: 'history',
  routes,
});
