<template>
  <div>
    <Suspense>
      <SubComponent
        v-model:msg="msg"
        :titles="props.titles"
        @update:titles="$emit('update:titles', $event)"
      />
    </Suspense>
    <Suspense>
      <SubComponent
        v-model:msg="msg"
        :titles="props.titles"
        @update:titles="$emit('update:titles', $event)"
      />
    </Suspense>
  </div>
</template>

<script setup lang="ts">
import SubComponent from './SubComponent.vue'

import { ref } from 'vue'
const msg = ref('initial msg')

const props = defineProps<{ titles: { left: string; right: string } }>()
defineEmits<{
  (e: 'update:titles', newTitles: { left: string; right: string }): void
}>()
</script>
