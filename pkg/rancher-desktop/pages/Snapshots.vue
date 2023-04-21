<script lang="ts">
import Vue from 'vue';

import Snapshots from '@pkg/components/Snapshots.vue';

export default Vue.extend({
  components: { Snapshots },
  data() {
    return {};
  },

  computed: {},

  watch: {},

  mounted() {
    this.$store.dispatch(
      'page/setHeader',
      { title: this.t('snapshots.title') },
    );

    this.$store.dispatch(
      'page/setAction',
      { action: 'snapshots-button-create' },
    );
  },
  beforeDestroy() {
  },

  methods: {},
});

</script>

<template>
  <div>
    <nuxt-child />
    <Snapshots
      class="content"
      data-test="SnapshotsTable"
    />
  </div>
</template>

<style lang="scss" scoped>
  .content {
    padding-top: 13px;
  }
</style>
