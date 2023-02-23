<template>
  <div>
    <suspense>
      <sub-component
        v-model:msg="msg"
        :titles="props.titles"
        @update:titles="$emit('update:titles', $event)"
      />
    </suspense>
    <suspense>
      <sub-component
        v-model:msg="msg"
        :titles="props.titles"
        @update:titles="$emit('update:titles', $event)"
      />
    </suspense>
  </div>
</template>

<script setup lang="ts">
import SubComponent from './sub-component.vue'

import { ref } from 'vue'
const msg = ref('initial msg')

const props = defineProps<{ titles: { left: string; right: string } }>()
defineEmits<{
  (e: 'update:titles', newTitles: { left: string; right: string }): void
}>()
</script>
