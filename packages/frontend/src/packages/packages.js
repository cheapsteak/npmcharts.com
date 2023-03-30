import { compileToFunctions } from 'vue-template-compiler';
// import withRender from './packages.html';
export const packages = [];
export const emitter = new (require('events').EventEmitter)();

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

export default {
  props: {
    onSubmit: Function,
    isUsingPresetComparisons: Boolean,
  },
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
    submit() {
      this.onSubmit(this.$refs.textbox.value.trim());
      this.$refs.textbox.value = '';
      this.$nextTick(() => {
        // XXX: can't use `this.$refs.textbox.focus();` because that element is no longer in the dom
        document.querySelector('input.package-input').focus();
      });
    },
    handleEnter() {
      this.isValid && this.submit();
    },
    validate() {
      this.isValid = this.$refs.textbox.value.trim() !== '';
    },
  },
  ...compileToFunctions(`<span>
  <input
    class="package-input"
    ref="textbox"
    @keyup="validate"
    @keyup.enter="handleEnter"
    placeholder="enter a package name"
    aria-label="package name"
    spellcheck="false"
    autofocus
  >
  <button
    class="add-package-btn"
    :disabled="!isValid"
    @click="handleClickSubmit($event)"
  >
    {{isUsingPresetComparisons ? 'set' : 'add'}}
  </button>
</span>`),
};
