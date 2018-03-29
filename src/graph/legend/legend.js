import Vue from 'vue';
import { removePackage } from '../../packages/packages.js';
import { isSameMonth, format as formatDate, addDays } from 'date-fns';

export default Vue.extend({
  props: {
    modules: Array,
    date: Date,
    groupByWeek: Boolean,
  },
  template: require('./legend.html'),
  methods: {
    removePackage(packageName) {
      ga('send', 'event', 'legend', 'remove', packageName);
      removePackage(packageName);
      this.$emit('legend-blur');
    },
    handleMouseEnterLegend() {
      this.$emit('legend-focus');
    },
    handleMouseLeaveLegend() {
      this.$emit('legend-blur');
    },
    handleMouseEnterPackage(packageName) {
      this.$emit('package-focus', packageName);
    },
    handleMouseLeavePackage(packageName) {
      this.$emit('package-blur', packageName);
    },
    formatWeekByStartingDate(startOfWeek) {
      const startDate = formatDate(startOfWeek, 'MMMM Do');
      const endOfWeek = addDays(startOfWeek, 6);
      if (isSameMonth(startOfWeek, endOfWeek)) {
        const endDate = formatDate(endOfWeek, 'Do');
        return `${startDate} - ${endDate}`;
      }
      const endDate = formatDate(addDays(startOfWeek, 6), 'MMMM Do');
      return `${startDate} - ${endDate}`;
    },
  },
});
