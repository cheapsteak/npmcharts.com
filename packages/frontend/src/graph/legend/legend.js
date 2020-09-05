import _ from 'lodash';
import { removePackage } from '../../packages/packages.js';
import {
  isSameMonth,
  format as formatDate,
  addDays,
  isSameYear,
} from 'date-fns';
import withRender from './legend.html';

export default withRender({
  props: {
    modules: Array,
    date: Date,
    interval: Number,
  },
  computed: {
    sortedModules() {
      return _.orderBy(this.modules, module => module.entries, ['desc']);
    },
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
    formatInterval(startOfPeriod) {
      const endOfPeriod = addDays(startOfPeriod, this.interval - 1);
      if (isSameMonth(startOfPeriod, endOfPeriod)) {
        return `${formatDate(startOfPeriod, 'MMMM Do')} - ${formatDate(
          endOfPeriod,
          'Do',
        )}, ${formatDate(startOfPeriod, 'YYYY')}`;
      } else if (isSameYear(startOfPeriod, endOfPeriod)) {
        return `${formatDate(startOfPeriod, 'MMMM Do')} - ${formatDate(
          endOfPeriod,
          'MMMM Do',
        )}, ${formatDate(startOfPeriod, 'YYYY')}`;
      }
      return `${formatDate(startOfPeriod, 'MMMM Do, YYYY')} - ${formatDate(
        endOfPeriod,
        'MMMM Do, YYYY',
      )}`;
    },
  },
});
