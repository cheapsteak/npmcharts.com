// import moment from 'moment';
import {removePackage} from '../../packages/packages.js';

export default Vue.extend({
  props: {
    modules: Array,
    date: Date
  },
  template: `
    <div class="legend">
      <div class="date">{{date | formatDate 'MMMM Do (dddd)'}}</div>
      <ul class="modules">
        <li class="module" v-for="module in modules" track-by="name" bind-style="{color: module.color}" on-click="removePackage(module.name)">
          <div class="nub"></div>
          {{module.name}}:&nbsp;{{module.downloads.toLocaleString()}}
        </li>
      </ul>
    </div>
  `,
  methods: {
    removePackage
  }
});