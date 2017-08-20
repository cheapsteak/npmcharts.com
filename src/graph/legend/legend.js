import {removePackage} from '../../packages/packages.js';

export default Vue.extend({
  props: {
    modules: Array,
    date: Date,
  },
  template: require('./legend.html'),
  methods: {
    removePackage (packageName) {
      ga('send', 'event', 'legend', 'remove', packageName);
      removePackage(packageName);
    },
    handleMouseEnterLegend () {
      this.$emit('legend-focus');
    },
    handleMouseLeaveLegend () {
      this.$emit('legend-blur');
    },
    handleMouseEnterPackage (packageName) {
      this.$emit('package-focus', packageName);
    },
    handleMouseLeavePackage (packageName) {
      this.$emit('package-blur', packageName);
    },
  }
});