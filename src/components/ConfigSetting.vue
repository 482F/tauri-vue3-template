<template>
  <div v-if="config" class="config-setting">
    {{ config }}
    <v-text-field v-model="config.value1" />
    <v-slider v-model="config.value2" />
    <v-slider v-model="config.value3" />
    <div
      :style="{
        'width': '100px',
        'height': '100px',
        'background-color': 'var(--color1)',
      }"
    />
    <div class="colors">
      <template
        v-for="(color, i) of config.colors"
        :key="color.name"
        class="color-row"
      >
        <div>{{ color.label }}:&nbsp;</div>
        <v-text-field v-model="color.value" />
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { getConfig } from '../utils/config'

const config = await getConfig()
</script>

<style lang="scss" scoped>
.config-setting {
  .colors {
    display: grid;
    grid-template: 1fr / max-content 1fr;
    align-items: center;
  }
}
</style>
