<!-- eslint-disable vue/no-mutating-props -->
<script lang="ts">
import debounce from 'lodash/debounce';
import Vue from 'vue';

import SortableTable from '@pkg/components/SortableTable/index.vue';

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
        icon:       'icon icon-delete',
        bulkable:   true,
        bulkAction: 'deleteSnapshots',
      },
    ];

    const snapshots = [
      {
        id:           'id-snap-1',
        snapshotName: 'snap-1',
        createdAt:    '2023-03-22 01:00',
      },
      {
        id:           'id-snap-2',
        snapshotName: 'snap-2',
        createdAt:    '2023-04-20 01:00',
      },
      {
        id:           'id-snap-3',
        snapshotName: 'snap-3',
        createdAt:    '2023-02-28 01:00',
      },
      {
        id:           'id-snap-4',
        snapshotName: 'snap-4',
        createdAt:    '2023-01-28 01:00',
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
    restoreSnapshot(snapshot: any) {
      console.log('restore', snapshot);

      this.isDisabled = true;
      this.restoring = snapshot;

      debounce(() => {
        this.isDisabled = false;
        this.restoring = {};
      }, 1000)();
    },
    deleteSnapshot(snapshot: any) {
      console.log('delete', snapshot );

      this.isDisabled = true;

      debounce(() => {
        this.snapshots = this.snapshots.filter((item: any) => item.id !== snapshot.id);

        this.isDisabled = false;
      }, 500)();
    },

    deleteSnapshots() {
      console.log('delete bulk', this.selected);

      this.isDisabled = true;

      debounce(() => {
        this.snapshots = this.snapshots.filter((item: any) => !this.selected.map((s: any) => s.id).includes(item.id));

        this.isDisabled = false;
      }, 500)();
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
      <template #cell:restore="{row}">
        <button
          data-test="button-restore-snapshot"
          type="button"
          class="btn btn-sm role-secondary"
          @click="restoreSnapshot(row)"
        >
          {{ t('snapshots.table.action.restore') }}
        </button>
      </template>
      <template #cell:delete="{row}">
        <button
          data-test="button-delete-snapshot"
          type="button"
          class="btn btn-sm role-secondary"
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
}
</style>
