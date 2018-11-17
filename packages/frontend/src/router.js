import Vue from 'vue';
import VueRouter from 'vue-router';

Vue.use(VueRouter);

module.exports = new VueRouter({
  mode: 'history',
  route: [
    { path: '/', component: require('./home/home').default },
    { path: '/compare', component: require('./home/home').default },
    { path: '/compare/*packages', component: require('./home/home').default },
  ],
});
