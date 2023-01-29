<template>
  <h1>{{ msg }}</h1>
  <v-btn @click="updateMsg">{{ count }}</v-btn>
</template>

<script setup lang="ts">
import { invoke } from '@tauri-apps/api'
import { ref } from 'vue'

const props = withDefaults(defineProps<{ msg: string }>(), {
  msg: 'default msg',
})

const count = ref(0)
const emits = defineEmits<{ (e: 'update:msg', msg: string): void }>()
async function updateMsg() {
  emits('update:msg', await invoke('update_msg', { now: new Date().getTime() }))
  count.value++
}
</script>

<style scoped></style>
