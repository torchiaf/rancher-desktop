<script lang="ts">
import Vue from 'vue';

import Snapshots from '@pkg/components/Snapshots.vue';

export default Vue.extend({
  components: { Snapshots },
  data() {
    return { };
  },

  computed: {},

  watch: {},

  mounted() {
  },

  beforeDestroy() {
  },

  methods: {
    onChange(snapshots: any[]) {
      this.$store.dispatch(
        'page/setHeader',
        {
          title:  `${ snapshots?.length } ${ this.t('snapshots.title') }`,
          action: 'snapshots-button-create',
        },
      );
    },
  },
});

</script>

<template>
  <div>
    <nuxt-child />
    <Snapshots
      class="content"
      data-test="snapshots-table"
      @change="onChange($event)"
    />
  </div>
</template>

<style lang="scss" scoped>
  .content {
    padding-top: 13px;
  }
</style>
