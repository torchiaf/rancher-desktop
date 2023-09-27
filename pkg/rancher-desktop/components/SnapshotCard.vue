<script lang="ts">
import Vue from 'vue';

import type { PropType } from 'vue';
import { Snapshot } from '@pkg/main/snapshots/types';
import { startCase } from 'lodash';
import { ipcRenderer } from '@pkg/utils/ipcRenderer';

interface Data {
}

export default Vue.extend<Data, any, any, any>({
  name: 'snapshot-card',
  props: {
    value: {
      type:     Object as PropType<Snapshot>,
      required: true,
    },
  },

  methods: {
    async restore() {
      const ok = await this.showWarningModal('restore');

      if (ok) {
        await this.$store.dispatch('snapshots/restore', this.value.id);
      }
    },

    async remove() {
      const ok = await this.showWarningModal('delete');

      if (ok) {
        await this.$store.dispatch('snapshots/delete', this.value.id);
      }
    },

    // Todo remove
    async showWarningModal(action: string) {
      const result = await ipcRenderer.invoke('show-message-box', {
        title:    `Snapshot ${ action }`,
        type:     'warning',
        message:  `Do you want to ${ action } ${ this.value?.name || 'selected Snapshots' }?`,
        cancelId: 1,
        buttons:  [
          `${ startCase(action) }`,
          'Cancel',
        ],
      });

      if (result.response === 1) {
        return false;
      }

      return true;
    }
  },
});

</script>

<template>
  <div class="snapshot-card">
    <div class="content">
      <div class="header">
        <h2>{{ value.name }}</h2>
      </div>
      <div class="body">
        <div>
          <span>{{ t('snapshots.card.body.createdAt') }}: </span>
          <span class="value">{{ value.created }}</span>
        </div>
        <div>
          <span>{{ t('snapshots.card.body.notes') }}: </span>
          <span class="value">{{ value.notes || 'n/a' }}</span>
        </div>
      </div>
    </div>
    <!-- TODO fix css in case of resized windows-->
    <div class="actions">
      <button
        class="btn btn-xs role-primary restore"
        @click="restore"
      >
        {{ t('snapshots.card.action.restore') }}
      </button>
      <button
        class="btn btn-xs role-secondary remove"
        @click="remove"
      >
        {{ t('snapshots.card.action.remove') }}
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .snapshot-card {
    display: flex;
    border: 1px solid var(--border);
    box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);

    .actions {
      max-width: 200px;
    }

    .content, .actions {
      display: flex;
      flex-direction: column;
      gap: 15px;
      flex-grow: 1;
      padding: 20px;
    }

    .content .body {
      .value {
        color: var(--input-label);
      }
    }

  }
</style>
