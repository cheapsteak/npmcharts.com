import {removePackage} from '../../packages/packages.js';

export default Vue.extend({
  props: {
    modules: Array,
    date: Date
  },
  template: `
    <div class="legend">
      <table class="modules">
        <thead class="date">
          <th>{{date | formatDate 'dddd'}}</th>
          <th>{{date | formatDate 'MMMM Do'}}</th>
        </thead>
        <tbody>
          <tr
            class="module"
            v-for="module in modules | orderBy 'downloads' -1"
            track-by="name"
            :style="{color: module.color}"
            @click="removePackage(module.name)"
          >
            <td class="name-wrapper">
              <div class="name">
                <div class="nub" role="presentation">
                  <div class="before" :style="{ backgroundColor: module.color }"></div>
                  <div class="after" :style="{ backgroundColor: module.color }"></div>
                </div>
                {{module.name}}
              </div>
            </td>
            <td class="downloads">{{module.downloads.toLocaleString()}}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  methods: {
    removePackage
  }
});