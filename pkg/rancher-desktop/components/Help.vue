<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name:       'help',
  props:      {
    message: {
      type:     String,
      required: true,
    },
  },
});
</script>

<template>
  <div>Help Button</div>
</template>

<style lang="scss" scoped>
</style>
