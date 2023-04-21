<template>
  <div>
    ciao snapshot
  </div>
</template>

<script>

export default {
  components: {},
  data() {
    return {};
  },
  mounted() {
    this.$store.dispatch(
      'page/setHeader',
      { title: this.t('snapshots.create.title') },
    );
  },
  methods: {},
};
</script>
