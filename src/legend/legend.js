export default Vue.extend({
  props: {
    modules: Array,
    palette: Array
  },
  template: `
    <div class="legend">
      <div class="module" v-for="module in modules" bind-style="{color: palette[$index]}" on-click="onModuleClicked(module)">
        <div class="nub" bind-style="{backgroundColor: palette[$index]}"></div>
        {{module}}
      </div>
    </div>
  `,
  methods: {
    onModuleClicked (module) {
      removePackage(module);
    }
  }
});