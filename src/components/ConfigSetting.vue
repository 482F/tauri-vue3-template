<template>
  <div v-if="config">
    {{ config }}
    <v-text-field v-model="config.value1" />
    <v-slider v-model="config.value2" />
    <v-slider v-model="config.value3" />
  </div>
</template>

<script lang="ts" setup>
import { getConfig } from '../utils/config'

const config = await getConfig()
</script>
