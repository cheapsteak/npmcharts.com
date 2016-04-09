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
    <span>
      <input
        class="package-input"
        v-el:textbox
        @keyup="validate"
        placeholder="package name"
      >
      <button
        class="add-package-btn"
        :disabled="!valid"
        @click="submit($els.textbox.value, $event)"
      >
        add
      </button>
    </span>
  `,
  data () {
    return {
      valid: false
    };
  },
  methods: {
    submit (val, e) {
      e && e.preventDefault() && e.stopPropagation();
      this.onSubmit(val);
      this.$els.textbox.value = '';
    },
    validate () {
      this.valid = this.$els.textbox.value !== "";
    }
  }
})