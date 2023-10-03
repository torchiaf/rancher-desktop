<script lang="ts">
import Vue from 'vue';
import { mapGetters } from 'vuex';
import SnapshotCard from '@pkg/components/SnapshotCard.vue';
import { Banner } from '@rancher/components';
import { SnapshotEvent } from '@pkg/main/snapshots/types';
import { ipcRenderer } from '@pkg/utils/ipcRenderer';

interface Data {
  snapshotEvent: SnapshotEvent | null,
  snapshotsPollingInterval: NodeJS.Timer | null,
}

export default Vue.extend<Data, any, any, any>({
  components: { Banner, SnapshotCard },

  data(): Data {
    return {
      snapshotEvent: null,
      snapshotsPollingInterval: null
    };
  },

  computed: {
    ...mapGetters('snapshots', { snapshots: 'list' }),
  },

  watch: {
    snapshots: {
      handler(neu) {
        this.$emit('change', neu);
      },
      immediate: true,
    },
  },

  beforeMount() {
    ipcRenderer.on('snapshot', (_, event) => {
      this.snapshotEvent = event;
    });
    if (this.$route.params) {
      this.snapshotEvent = this.$route.params.event;
    }
    this.$store.dispatch('snapshots/fetch');
    this.pollingStart();
  },

  beforeDestroy() {
    clearInterval(this.snapshotsPollingInterval);
  },

  methods: {
    pollingStart() {
      this.snapshotsPollingInterval = setInterval(() => {
        this.$store.dispatch('snapshots/fetch');
      }, 1500);
    }
  },
});
</script>

<template>
  <div class="snapshots">
    <Banner
      v-if="snapshotEvent"
      class="banner mb-20"
      color="success"
    >
      {{ t(`snapshots.info.${ snapshotEvent.type }.${ snapshotEvent.result }`, { snapshot: snapshotEvent.name }) }}
    </Banner>
    <div
      v-for="item of snapshots"
      :key="item.id"
    >
      <SnapshotCard
        class="mb-20"
        :value="item"
      />
    </div>
  </div>
</template>
