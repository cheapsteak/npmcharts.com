<template>
  <span>
    <input
      class="package-input"
      ref="textbox"
      @keyup="validate"
      @keyup.enter="handleEnter"
      placeholder="enter a package name"
      aria-label="package name"
      spellcheck="false"
      autofocus
    />
    <button
      class="add-package-btn"
      :disabled="!isValid"
      @click="handleClickSubmit($event)"
    >
      {{ isUsingPresetComparisons ? 'set' : 'add' }}
    </button>
  </span>
</template>

<script>
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
  inject: ['addPackage'],
  emits: ['submit'],
  methods: {
    handleClickSubmit(e) {
      e && e.preventDefault() && e.stopPropagation();
      this.submit();
    },
    submit() {
      this.$emit('submit', this.$refs.textbox.value.trim());
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
}
</script>
