<!-- eslint-disable vue/no-mutating-props -->
<script lang="ts">
import { BadgeState } from '@rancher/components';
import debounce from 'lodash/debounce';
import Vue from 'vue';

import SortableTable from '@pkg/components/SortableTable/index.vue';

interface Data {
  headers: any[],
  snapshots: any[],
  selected: any,
  isDisabled: boolean,
  restoring: any,
}

export default Vue.extend<Data, any, any, any>({
  components: {
    BadgeState,
    SortableTable,
  },
  props: { },

  data(): Data {
    const headers = [
      {
        name:  'snapshotName',
        label: this.t('snapshots.table.header.snapshotName'),
        sort:  ['snapshotName', 'createdAt', 'state'],
        icon:  'icon-snapshot',
      },
      {
        name:  'createdAt',
        label: this.t('snapshots.table.header.createdAt'),
        sort:  ['createdAt', 'snapshotName', 'state'],
        icon:  'icon-history',
      },
      {
        name:  'updatedAt',
        label: this.t('snapshots.table.header.updatedAt'),
        sort:  ['updatedAt', 'snapshotName', 'state'],
        icon:  'icon-history',
      },
      {
        name:  'type',
        label: this.t('snapshots.table.header.type'),
        sort:  ['type', 'snapshotName', 'state'],
        icon:  'icon-storage',
      },
      {
        name:  'state',
        label: this.t('snapshots.table.header.state'),
        sort:  ['state', 'snapshotName', 'createdAt'],
        icon:  'icon-gear',
      },
    ];

    const snapshots = [
      {
        id:           'id-snap-1',
        snapshotName: 'snap-1',
        createdAt:    '2023-03-22 01:00',
        updatedAt:    '2023-04-23 01:00',
        type:         'scheduled',
        state:        'active',
      },
      {
        id:           'id-snap-2',
        snapshotName: 'snap-2',
        createdAt:    '2023-04-20 01:00',
        updatedAt:    '2023-04-23 01:00',
        type:         'manual',
        state:        'completed',
      },
      {
        id:           'id-snap-3',
        snapshotName: 'snap-3',
        createdAt:    '2023-02-28 01:00',
        updatedAt:    '2023-04-29 01:00',
        type:         'manual',
        state:        'completed',
      },
      {
        id:           'id-snap-4',
        snapshotName: 'snap-4',
        createdAt:    '2023-01-28 01:00',
        updatedAt:    '2023-06-29 01:00',
        type:         'manual',
        state:        'saving',
      },
    ];

    return {
      headers,
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
          availableActions: this.getAvailableActions(snapshot),
          state:            this.getState(snapshot),
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
        this.snapshots = this.snapshots.map((item: any) => ({
          ...item,
          state: item.id === snapshot.id ? 'active' : 'completed',
        }));

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

    getAvailableActions(snapshot: any) {
      return [
        {
          label:    this.t('snapshots.table.action.restore'),
          action:   'restoreSnapshot',
          enabled:  snapshot.state !== 'active',
          icon:     'icon icon-refresh',
          bulkable: false,
        },
        {
          label:      this.t('snapshots.table.action.delete'),
          action:     'deleteSnapshot',
          enabled:    true,
          icon:       'icon icon-delete',
          bulkable:   true,
          bulkAction: 'deleteSnapshots',
        },
      ];
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

    // todo use state type, not string
    getState(snapshot: any) {
      const state = snapshot.state;

      return {
        id:         state,
        background: state === 'active' ? 'bg-success' : 'bg-info',
        label:      this.t(`snapshots.table.columns.state.${ state.id || state }`),
      };
    },
  },
});
</script>

<template>
  <div>
    <SortableTable
      ref="snapshotsTable"
      class="snapshotsTable"
      data-test="snapshotsTable"
      key-field="id"
      default-sort-by="createdAt"
      :headers="headers"
      :rows="rows"
      :table-actions="true"
      :class="{'disabled': isDisabled}"
      @selection="updateSelection"
    >
      <template #cell:state="{row}">
        <div
          v-if="row.state.id === 'saving'"
          class="saving-bar"
        >
          <div class="loading"></div>
        </div>
        <i
          v-else-if="restoring.id === row.id || (restoring.id && row.state.id === 'active')"
          class="icon icon-spinner"
        />
        <div v-else class="state">
          <BadgeState
            :color="row.state.background"
            :label="row.state.label"
            class="badge"
          />
        </div>
      </template>
    </SortableTable>
  </div>
</template>

<style lang="scss" scoped>
.snapshotsTable {
  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.saving-bar {
  display: flex;
  border-radius: 7.5px;
  background-color: var(--border);
  border: 1px solid var(--border);
  height: 18px;
  width: 75px;

  .loading {
    border-radius: 7.5px;
    background-color: var(--success);
    width: 35%;
  }
}
</style>
