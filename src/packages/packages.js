export const packages = [];
export const emitter = new (require('events').EventEmitter)();

export function addPackage (name, notify=true) {
  packages.indexOf(name) === -1 && packages.push(name);
  notify && emitter.emit('change');
}

export function removePackage (name, notify=true) {
  packages.splice(packages.indexOf(name), 1);
  notify && emitter.emit('change');
}

export function setPackages (val, notify=true) {
  packages.splice(0, packages.length, ...val);
  notify && emitter.emit('change');
}

export default Vue.extend({
  props: {
    onSubmit: Function
  },
  template: `
    <input $$.textbox on-keyup-enter="submit($$.textbox.value)">
  `,
  methods: {
    submit (val) {
      this.onSubmit(val);
      this.$$.textbox.value = '';
    }
  }
})