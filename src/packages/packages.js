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
    <input $$.textbox on-keyup="validate">
    <button class="add" bind-disabled="!valid" on-click="submit($$.textbox.value, $event)">add</button>
  `,
  data () {
    return {
      valid: false
    };
  },
  methods: {
    submit (val, e) {
      this.onSubmit(val);
      this.$$.textbox.value = '';
      e && e.preventDefault() && e.stopPropagation();
    },
    validate () {
      this.valid = this.$$.textbox.value !== "";
    }
  }
})