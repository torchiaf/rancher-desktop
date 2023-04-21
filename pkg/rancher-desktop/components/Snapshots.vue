<script lang="ts">
import Vue from 'vue';

import SortableTable from '@pkg/components/SortableTable/index.vue';

export default Vue.extend({
  components: { SortableTable },
  props:      { },

  data() {
    return {
      headers: [
        {
          name:  'snapshotName',
          label: this.t('snapshots.table.header.snapshotName'),
          sort:  ['snapshotName', 'createdAt', 'status'],
        },
        {
          name:  'createdAt',
          label: this.t('snapshots.table.header.createdAt'),
          sort:  ['snapshotName', 'createdAt', 'status'],
        },
        {
          name:  'updatedAt',
          label: this.t('snapshots.table.header.updatedAt'),
          sort:  ['snapshotName', 'createdAt', 'status'],
        },
        {
          name:  'type',
          label: this.t('snapshots.table.header.type'),
          sort:  ['snapshotName', 'createdAt', 'status'],
        },
        {
          name:  'status',
          label: this.t('snapshots.table.header.status'),
          sort:  ['snapshotName', 'createdAt', 'status'],
        },
      ],
      rows: [
        {
          snapshotName: 'snap-1',
          createdAt:    '2023-04-22',
          updatedAt:    '2023-04-23',
          type:         'scheduled',
          status:       'completed',
        },
        {
          snapshotName: 'snap-2',
          createdAt:    '2023-04-20',
          updatedAt:    '2023-04-23',
          type:         'scheduled',
          status:       'completed',
        },
        {
          snapshotName: 'snap-3',
          createdAt:    '2023-04-28',
          updatedAt:    '2023-04-29',
          type:         'scheduled',
          status:       'completed',
        },
      ],
    };
  },
});
</script>

<template>
  <div>
    <SortableTable
      ref="snapshotsTable"
      class="snapshotsTable"
      data-test="snapshotsTable"
      default-sort-by="snapshotName"
      :headers="headers"
      :rows="rows"
      :table-actions="true"
    >
    </SortableTable>
  </div>
</template>

<style lang="scss" scoped>

</style>
