'use strict';

import 'whatwg-fetch';
import 'babel/polyfill';
import _ from 'lodash';
import Vue from 'vue';

window._ = _;

import router from './router.js';

Vue.config.debug = true;

var {default: packageInput, packages} = require('./packages/packages.js');

const App = Vue.extend({
  components: {
    'package-input': packageInput
  },
  data () {
    return { packages };
  },
  computed: {
    isUsingPresetData () {
      return !(this.$route.params && this.$route.params.packages);
    }
  },
  ready () {
    window.aaa = this;
  },
  methods: {
    addPackage (packageName) {
      if (this.$route.params && this.$route.params.packages) {
        this.$route.router.go('/compare/' + this.$route.params.packages + ',' + packageName);
      } else {
        this.$route.router.go('/compare/' + packageName);
      }
    },
    clearPackages () {
      this.$route.router.go('/compare/');
    }
  }
  // watch: {
    // packages (packages) {
    //   this.$route.router.go('/compare/' + packages.join(','));
    // }
  // }
});

router.start(App, 'body');