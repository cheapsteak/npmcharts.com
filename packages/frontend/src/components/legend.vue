<template>
  <div
  class="legend"
>
  <table class="modules">
    <thead class="date" v-if="interval > 1">
      <th class="" colspan="2">{{formatInterval(date)}}</th>
    </thead>
    <thead class="date" v-else>
      <th class="package-downloads-heading">{{date | formatDate('dddd')}}</th>
      <th class="package-name-heading">{{date | formatDate('MMMM Do, YYYY')}}</th>
    </thead>
    <tbody
      @mouseEnter="handleMouseEnterLegend()"
      @mouseLeave="handleMouseLeaveLegend()"
    >
      <tr
        class="module"
        v-for="module in sortedModules"
        track-by="name"
        :style="{color: module.color}"
        @click="removePackage(module.name)"
        @mouseEnter="handleMouseEnterPackage(module.name)"
        @mouseLeave="handleMouseLeavePackage(module.name)"
      >
        <td class="downloads">{{module.downloads.toLocaleString()}}</td>
        <td class="name-wrapper">
          <div class="name">
            <div class="nub" role="presentation">
              <div class="before" :style="{ backgroundColor: module.color }"></div>
              <div class="after" :style="{ backgroundColor: module.color }"></div>
            </div>
            {{module.name}}
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</div>
</template>

<script>
import _ from 'lodash';
import { removePackage } from './packages.vue';
import {
  isSameMonth,
  format as formatDate,
  addDays,
  isSameYear,
} from 'date-fns';

export default {
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
};

</script>

<style scoped>

@import "../stylus/home.styl"

</style>