<script>
import router from './router.js';

export default {
  router,
  render(h) {
    return h('router-view', {
      key: this.$route.fullPath,
    });
  },
}
</script>