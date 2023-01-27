<template>
  <SubComponent v-model:msg="msg" />
</template>

<script setup lang="ts">
import SubComponent from './SubComponent.vue'

import { ref } from 'vue'
const msg = ref('initial msg')
</script>
