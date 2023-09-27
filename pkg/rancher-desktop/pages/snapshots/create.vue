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
      creating: false,
      goBack:   () => {},
    };
  },
  computed: { },

  created() {
    this.goBack = debounce(() => this.$router.back(), 1000);
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
    async submit() {
      document.getSelection()?.removeAllRanges();
      this.creating = true;

      const { name } = this;

      await this.$store.dispatch('snapshots/create', { name });

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
