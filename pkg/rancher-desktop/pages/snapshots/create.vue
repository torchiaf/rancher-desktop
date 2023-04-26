<script lang="ts">

import { LabeledInput } from '@rancher/components';
import debounce from 'lodash/debounce';
import Vue from 'vue';

const defaultName = () => {
  const dateString = new Date()
    .toISOString()
    .slice(0, 19)
    .replace('T', '_')
    .replace(/-/g, '_')
    .replace(/:/g, '_');

  return `snap_${ dateString }`;
};

interface Data {
}

export default Vue.extend<Data, any, any, any>({
  components: { LabeledInput },
  data() {
    return {
      name:     defaultName(),
      types:    ['scheduled', 'manual'],
      type:     'manual',
      creating: false,
      goBack:   () => {},
    };
  },
  computed: { },

  created() {
    this.goBack = debounce(() => this.$router.back(), 300);
  },

  mounted() {
    this.$store.dispatch(
      'page/setHeader',
      { title: this.t('snapshots.create.title') },
    );
    (this.$refs.nameInput as any)?.focus();
    (this.$refs.nameInput as any)?.select();
  },
  methods: {
    onChangeType(event: any) {
      this.type = event.target.value;
    },
    submit() {
      console.log('submit', this.name, this.type );
      this.creating = true;

      this.goBack();
    },
  },
});
</script>

<template>
  <div class="snapshot-form">
    <LabeledInput
      ref="nameInput"
      v-model="name"
      v-focus
      type="text"
      class="field name-field"
      :disabled="creating"
      :label="t('snapshots.create.name.label')"
    />

    <div class="field type-field">
      <label style="margin-bottom: 3px; display: block;">(Opt)</label>
      <select
        :value="type"
        :disabled="creating"
        @change="onChangeType($event)"
      >
        <option v-for="tp in types" :key="tp" :value="tp" :selected="tp === type">
          {{ tp }}
        </option>
      </select>
    </div>

    <button
      class="btn role-primary btn-lg"
      :disabled="!name || creating"
      @click="submit"
    >
      <i
        v-if="creating"
        class="icon icon-spinner"
      />
      <span>{{ t('snapshots.create.submit') }}</span>
    </button>
  </div>
</template>

<style lang="scss" scoped>
  .snapshot-form {
    max-width: 500px;
    padding-top: 10px;

    .type-field {
      padding-bottom: 20px;
    }
  }
</style>
