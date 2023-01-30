<template>
  <div>
    <v-text-field v-model="config.value1" />
    <v-slider v-model="config.value2" />
    <v-slider v-model="config.value3" />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { defaultConfig, initConfig } from '../utils/config'

const config = ref(defaultConfig)
const ready = ref(false)
;(async () => {
  config.value = await initConfig()
  ready.value = true
})()
</script>
