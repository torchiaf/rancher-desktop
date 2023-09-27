<!-- eslint-disable vue/no-mutating-props -->
<script lang="ts">
import SortableTable from '@pkg/components/SortableTable/index.vue';
import { Snapshot } from '@pkg/main/snapshots/types';
import { ipcRenderer } from '@pkg/utils/ipcRenderer';
import { startCase } from 'lodash';
import Vue from 'vue';
import { mapGetters } from 'vuex';

interface Data {
  headers: any[],
  availableActions: any[],
  isDisabled: boolean,
  restoring: any,
}

export default Vue.extend<Data, any, any, any>({
  components: { SortableTable },
  props:      { },

  data(): Data {
    const headers = [
      {
        name:  'id',
        label: this.t('snapshots.table.header.id'),
        sort:  ['name', 'created'],
      },
      {
        name:  'name',
        label: this.t('snapshots.table.header.name'),
        sort:  ['name', 'created'],
      },
      {
        name:  'created',
        label: this.t('snapshots.table.header.created'),
        sort:  ['name', 'created'],
      },
      {
        name:  'notes',
        label: this.t('snapshots.table.header.notes'),
        sort:  ['name', 'created'],
      },
    ];

    const availableActions = [
      {
        label:    this.t('snapshots.table.action.restore'),
        action:   'restore',
        enabled:  true,
        icon:     'icon icon-refresh',
        bulkable: false,
      },
      {
        label:    this.t('snapshots.table.action.delete'),
        action:   'delete',
        enabled:  true,
        bulkable: false,
      },
    ];

    return {
      headers,
      availableActions,
      isDisabled: false,
      restoring:  {},
    };
  },

  computed: {
    ...mapGetters('snapshots', { snapshots: 'list' }),
    rows() {
      return this.snapshots?.map((snapshot: Snapshot) => {
        const res = {
          ...snapshot,
          availableActions: this.availableActions,
        };

        this._bindActionsCallbacksToRow(res);

        return res;
      }) || [];
    },
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
    ipcRenderer.on('snapshots/changed', () => {
      this.$store.dispatch('snapshots/fetch');
    });
    this.$store.dispatch('snapshots/fetch');
  },

  methods: {
    async restore(snapshot: Snapshot) {
      this.isDisabled = true;
      this.restoring = snapshot;

      const ok = await this.showWarningModal('restore', snapshot);

      if (ok) {
        await this.$store.dispatch('snapshots/restore', snapshot.id);
      }

      this.isDisabled = false;
      this.restoring = {};
    },
    async delete(snapshot: Snapshot) {
      this.isDisabled = true;

      const ok = await this.showWarningModal('delete', snapshot);

      if (ok) {
        await this.$store.dispatch('snapshots/delete', snapshot.id);
      }

      this.isDisabled = false;
    },

    _bindActionsCallbacksToRow(snapshot: any) {
      (snapshot.availableActions as any[]).forEach(({ action }) => {
        if (!snapshot[action]) {
          snapshot[action] = this[action].bind(this, snapshot);
        }
      });
    },

    // Todo translations
    async showWarningModal(action: string, snapshot: Snapshot) {
      const result = await ipcRenderer.invoke('show-message-box', {
        title:    `Snapshot ${ action }`,
        type:     'warning',
        message:  `Do you want to ${ action } ${ snapshot?.name || 'selected Snapshots' }?`,
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
    },
  },
});
</script>

<template>
  <div>
    <SortableTable
      ref="snapshotsTable"
      class="snapshots-table"
      data-test="snapshotsTable"
      key-field="id"
      default-sort-by="createdAt"
      :headers="headers"
      :rows="rows"
      :table-actions="false"
      :class="{'disabled': isDisabled}"
    >
      <template #cell:size="{row}">
        <span>{{ `${row.size} Mb` }}</span>
      </template>
    </SortableTable>
  </div>
</template>

<style lang="scss" scoped>
.snapshots-table {
  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .role-secondary.btn-sm {
    line-height: 28px;
  }

  .delete-btn {
    color: var(--error) !important;
    border: solid 1px var(--error);
  }

  .snapshot-size-bar {
    display: flex;
    border-radius: 7.5px;
    background-color: var(--border);
    border: 1px solid var(--border);
    height: 18px;
    width: 75px;

    .size {
      border-radius: 7.5px;
      background-color: var(--success);
      width: 60%;
      margin-left: -1px
    }
  }

  .modal .vm--modal {
    background-color: var(--body-bg);
  }
}
</style>

<style lang="scss">
  .role-multi-action {
    border: solid 1px var(--primary) !important;
    border-radius: var(--border-radius);
    font-size: 15px !important;
  }
</style>
