export default Vue.extend({
  props: {
    onModuleClicked: {
      type: Function,
      required: true
    },
    modules: Array,
    palette: Array
  },
  ready () {

  },
  template: `
    <div class="legend">
      <div class="module" v-for="module in modules" bind-style="{color: palette[$index]}" on-click="onModuleClicked(module)">
        <div class="nub"></div>
        {{module}}
      </div>
    </div>
  `
});