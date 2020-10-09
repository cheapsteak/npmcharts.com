import withRender from './packages.html';
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

export default withRender({
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
    submit(val) {
      this.onSubmit(this.$refs.textbox.value.trim());
      this.$refs.textbox.value = '';
    },
    handleEnter() {
      this.isValid && this.submit();
    },
    validate() {
      this.isValid = this.$refs.textbox.value.trim() !== '';
    },
  },
});
