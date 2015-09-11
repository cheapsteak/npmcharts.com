export const packages = [];

export function addPackage (name) {
  packages.indexOf(name) === -1 && packages.push(name);
}

export function removePackage (name) {
  packages.splice(packages.indexOf(name), 1)
}

export function setPackages (val) {
  packages.splice(0, packages.length, ...val);
}

export default Vue.extend({
  props: {
    onSubmit: Function
  },
  template: `
    <input el="textbox" on-keyup-enter="submit($$.textbox.value)">
  `,
  methods: {
    submit (val) {
      this.onSubmit(val);
      this.$$.textbox.value = '';
    }
  }
})