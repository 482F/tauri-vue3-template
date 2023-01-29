<template>
  <div v-if="ready">
    <h1>{{ msg }}</h1>
    <v-btn @click="updateMsg">{{ count }}</v-btn>
    <div>{{ commandlinePayload }}</div>
    {{ config }}
    <v-text-field v-model="config.value1" />
    <v-slider v-model="config.value2" />
    <div>line</div>
    <div>line</div>
    <div>line</div>
    <div>line</div>
    <div>line</div>
    <div>line</div>
    <div>line</div>
    <div>line</div>
    <div>line</div>
    <div>line</div>
    <div>line</div>
    <div>line</div>
    <div>line</div>
    <div>line</div>
    <div>line</div>
    <div>line</div>
    <div>line</div>
    <div>line</div>
    <div>line</div>
    <div>line</div>
    <div>line</div>
    <div>line</div>
    <div>line</div>
    <div>line</div>
    <div>line</div>
  </div>
</template>

<script setup lang="ts">
import { invoke } from '@tauri-apps/api'
import { ref } from 'vue'
import { listen } from '@tauri-apps/api/event'
import { register } from '@tauri-apps/api/globalShortcut'
import { appWindow } from '@tauri-apps/api/window'
import { defaultConfig, initConfig } from '../utils/config'
import { CommandlinePayload } from '../utils/common'

register('CmdOrControl+Shift+Alt+H', () => appWindow.hide())
register('CmdOrControl+Shift+Alt+S', () => appWindow.show())

const commandlinePayload = ref<CommandlinePayload>({
  argv: [],
  cwd: '',
})

function receiveCommandline(payload: CommandlinePayload) {
  commandlinePayload.value = payload
}

listen('commandline', (e: { payload: CommandlinePayload }) => {
  console.log('commandline', { e })
  receiveCommandline(e.payload)
})

invoke('get_commandline').then((payload: unknown) => {
  const isCommandlinePayload = (data: unknown): data is CommandlinePayload => {
    const payload = data as CommandlinePayload
    return Array.isArray(payload?.argv) && typeof payload?.cwd === 'string'
  }
  if (!isCommandlinePayload(payload)) {
    return
  }
  receiveCommandline(payload)
})

const props = withDefaults(
  defineProps<{ msg: string; titles: { left: string; right: string } }>(),
  {
    msg: 'default msg',
  }
)

const count = ref(0)
const emits = defineEmits<{
  (e: 'update:msg', msg: string): void
  (e: 'update:titles', newTitles: { left: string; right: string }): void
}>()
async function updateMsg() {
  emits('update:msg', await invoke('update_msg', { now: new Date().getTime() }))
  count.value++
  emits('update:titles', { ...props.titles, right: String(count.value) })
}

const config = ref(defaultConfig)
const ready = ref(false)
;(async () => {
  config.value = await initConfig()
  ready.value = true
})()
</script>

<style scoped></style>
