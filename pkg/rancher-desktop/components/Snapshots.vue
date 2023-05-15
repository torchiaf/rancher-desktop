<!-- eslint-disable vue/no-mutating-props -->
<script lang="ts">
import { debounce, startCase } from 'lodash';
import Vue from 'vue';

import SortableTable from '@pkg/components/SortableTable/index.vue';
import { ipcRenderer } from '@pkg/utils/ipcRenderer';

interface Data {
  headers: any[],
  availableActions: any[],
  snapshots: any[],
  selected: any,
  isDisabled: boolean,
  restoring: any,
}

export default Vue.extend<Data, any, any, any>({
  components: { SortableTable },
  props:      { },

  data(): Data {
    const headers = [
      {
        name:  'snapshotName',
        label: this.t('snapshots.table.header.snapshotName'),
        sort:  ['snapshotName', 'createdAt', 'state'],
      },
      {
        name:  'createdAt',
        label: this.t('snapshots.table.header.createdAt'),
        sort:  ['createdAt', 'snapshotName', 'state'],
      },
      {
        name:  'size',
        label: this.t('snapshots.table.header.size'),
        sort:  ['createdAt', 'snapshotName', 'state'],
      },
      {
        name:   'restore',
        label:  ' ',
        search: false,
        width:  50,
        align:  'right',
      },
      {
        name:   'delete',
        label:  ' ',
        search: false,
        width:  50,
        align:  'right',
      },
    ];

    const availableActions = [
      {
        label:      this.t('snapshots.table.action.delete'),
        action:     'deleteSnapshot',
        enabled:    true,
        bulkable:   true,
        bulkAction: 'deleteSnapshots',
      },
    ];

    const snapshots = [
      {
        id:           'id-snap-1',
        snapshotName: 'snap-1',
        createdAt:    '2023-03-22 01:00',
        size:         12345,
      },
      {
        id:           'id-snap-2',
        snapshotName: 'snap-2',
        createdAt:    '2023-04-20 01:00',
        size:         12345,
      },
      {
        id:           'id-snap-3',
        snapshotName: 'snap-3',
        createdAt:    '2023-02-28 01:00',
        size:         12345,
      },
      {
        id:           'id-snap-4',
        snapshotName: 'snap-4',
        createdAt:    '2023-01-28 01:00',
        size:         12345,
      },
    ];

    return {
      headers,
      availableActions,
      snapshots,
      selected:   null,
      isDisabled: false,
      restoring:  {},
    };
  },

  computed: {
    rows() {
      return this.snapshots.map((snapshot: any) => {
        const res = {
          ...snapshot,
          availableActions:   this.availableActions,
          disableContextMenu: true,
        };

        this._bindActionsCallbacksToRow(res);

        return res;
      });
    },
  },

  watch: {
    snapshots: {
      handler(neu) {
        console.log('emit', neu);
        this.$emit('change', neu);
      },
      immediate: true,
    },
  },

  methods: {
    updateSelection(v: any) {
      this.selected = v;
    },
    async restoreSnapshot(snapshot: any) {
      console.log('restore', snapshot);

      this.isDisabled = true;
      this.restoring = snapshot;

      const ok = await this.showWarningModal('restore', snapshot);

      debounce(() => {
        this.isDisabled = false;
        this.restoring = {};
      }, ok ? 1000 : 0)();
    },
    async deleteSnapshot(snapshot: any) {
      console.log('delete', snapshot );

      this.isDisabled = true;

      const ok = await this.showWarningModal('delete', snapshot);

      debounce(() => {
        if (ok) {
          this.snapshots = this.snapshots.filter((item: any) => item.id !== snapshot.id);
        }

        this.isDisabled = false;
      }, ok ? 500 : 0)();
    },

    async deleteSnapshots() {
      console.log('delete bulk', this.selected);

      this.isDisabled = true;

      const ok = await this.showWarningModal('delete');

      debounce(() => {
        if (ok) {
          this.snapshots = this.snapshots.filter((item: any) => !this.selected.map((s: any) => s.id).includes(item.id));
        }

        this.isDisabled = false;
      }, ok ? 500 : 0)();
    },

    _bindActionsCallbacksToRow(snapshot: any) {
      (snapshot.availableActions as any[]).forEach(({ action, bulkable, bulkAction }) => {
        if (!snapshot[action]) {
          snapshot[action] = this[action].bind(this, snapshot);
        }
        if (bulkable && bulkAction && !snapshot[bulkAction]) {
          snapshot[bulkAction] = this[bulkAction].bind(this, snapshot);
        }
      });
    },

    // Todo translations
    async showWarningModal(action: string, snapshot: any) {
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
      :row-actions="false"
      :table-actions="true"
      :class="{'disabled': isDisabled}"
      @selection="updateSelection"
    >
      <template #cell:size="{row}">
        <span>{{ `${row.size} Mb` }}</span>
      </template>

      <template #cell:restore="{row}">
        <button
          data-test="button-restore-snapshot"
          type="button"
          class="btn btn-sm role-secondary restore-btn"
          @click="restoreSnapshot(row)"
        >
          {{ t('snapshots.table.action.restore') }}
        </button>
      </template>

      <template #cell:delete="{row}">
        <button
          data-test="button-delete-snapshot"
          type="button"
          class="btn btn-sm role-secondary delete-btn"
          @click="deleteSnapshot(row)"
        >
          {{ t('snapshots.table.action.delete') }}
        </button>
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
