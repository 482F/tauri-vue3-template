<template>
  <div v-if="config" class="config-setting">
    <ConfigValueForm label="string" v-model="config.string" />
    <ConfigValueForm label="number" v-model="config.number" />
    <ConfigValueForm label="boolean" v-model="config.boolean" />
    <v-divider class="divider" />
    <ColorForm
      v-for="color of config.colors"
      :label="color.label"
      v-model="color.value"
    />
  </div>
</template>

<script lang="ts" setup>
import { getConfig } from '../../utils/config'
import ConfigValueForm from './ConfigValueForm.vue'
import ColorForm from './ColorForm.vue'

const config = await getConfig()
</script>

<style lang="scss" scoped>
.config-setting {
  padding: 24px;
  text-align: left;
  display: grid;
  grid-template: 1fr / max-content 1fr;
  align-items: center;
  gap: 8px 0px;
  > .divider {
    margin: 8px 0px;
    grid-area: 1 span / 2 span;
  }
}
</style>
