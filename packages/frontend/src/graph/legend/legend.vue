<template>
  <div class="legend">
    <div class="date" v-if="interval > 1">
      {{ formatInterval(date) }}
    </div>
    <div class="date" v-else>
      {{ date | formatDate('dddd MMMM Do, YYYY') }}
    </div>
    <table class="modules">
      <tbody
        @mouseover="handleMouseEnterLegend()"
        @mouseleave="handleMouseLeaveLegend()"
      >
        <tr
          class="module"
          v-for="module in sortedModules"
          track-by="name"
          :style="{ color: module.color }"
          @mouseover="handleMouseEnterPackage(module.name)"
          @mouseleave="handleMouseLeavePackage(module.name)"
        >
          <td class="actions">
            <button
              class="remove-entry-button"
              @click="removePackageByName(module.name)"
              :title="`remove '${module.name}' from comparison`"
            >
              <div
                class="nub"
                :style="{ '--module-color': module.color }"
              ></div>
            </button>
          </td>
          <td class="name-wrapper">
            <div class="name">
              {{ module.name }}
            </div>
          </td>
          <td class="downloads" style="min-width: 4.5em;">
            {{ module.downloads.toLocaleString() }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import _ from 'lodash';
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
  inject: ['removePackage'],
  methods: {
    removePackageByName(packageName) {
      ga('send', 'event', 'legend', 'remove', packageName);
      this.removePackage(packageName);
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
