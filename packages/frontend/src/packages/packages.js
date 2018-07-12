import Vue from 'vue';
export const packages = [];
export const emitter = new (require('events')).EventEmitter();

export function addPackage(name, notify = true) {
  packages.indexOf(name) === -1 && packages.push(name);
  notify && emitter.emit('change');
}

export function removePackage(name, notify = true) {
  packages.splice(packages.indexOf(name), 1);
  notify && emitter.emit('change');
}

export function setPackages(val, notify = true) {
  packages.splice(0, packages.length, ...val);
  notify && emitter.emit('change');
}

export default Vue.extend({
  props: {
    onSubmit: Function,
    isUsingPresetPackages: Boolean,
  },
  template: `
    <span>
      <input
        class="package-input"
        v-el:textbox
        @keyup="validate"
        @keyup.enter="handleEnter"
        placeholder="enter a package name"
        autofocus
      >
      <button
        class="add-package-btn"
        :disabled="!isValid"
        @click="handleClickSubmit($event)"
      >
        {{isUsingPresetPackages ? 'set' : 'add'}}
      </button>
    </span>
  `,
  data() {
    return {
      isValid: false,
    };
  },
  methods: {
    handleClickSubmit(e) {
      e && e.preventDefault() && e.stopPropagation();
      this.submit();
    },
    submit(val) {
      this.onSubmit(this.$els.textbox.value.trim());
      this.$els.textbox.value = '';
    },
    handleEnter() {
      this.isValid && this.submit();
    },
    validate() {
      this.isValid = this.$els.textbox.value.trim() !== '';
    },
  },
});
