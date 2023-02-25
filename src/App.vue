<template>
  <v-app
    id="app"
    :style="{
      ...configColorStyles,
    }"
  >
    <Titlebar
      v-if="currentWindow.titlebar"
      class="titlebar"
      :left-title="titles.left"
      :right-title="titles.right"
    />
    <Suspense>
      <component
        :is="currentComponent"
        class="main-component"
        v-model:titles="titles"
      />
    </Suspense>
  </v-app>
</template>

<script setup lang="ts">
import { ref, Ref, computed, defineComponent } from 'vue'
import Titlebar from './components/Titlebar.vue'
import { currentWindow, Valueof } from './utils/common'
import { getConfig, RefConfig } from './utils/config'

const titles = ref({
  left: 'tauri-vue3-template',
  right: '',
})

const configColors: Ref<Record<string, Valueof<RefConfig['value']['colors']>>> =
  ref({})
getConfig().then((config) => {
  configColors.value = config.value.colors
})
const configColorStyles = computed(() => {
  return Object.fromEntries(
    Object.entries(configColors.value).map(([key, { value }]) => [
      '--' + key,
      value,
    ])
  )
})
let currentComponent: Ref<undefined | ReturnType<typeof defineComponent>> =
  ref(undefined)
currentWindow.getComponent().then((component) => {
  currentComponent.value = component.default
})
</script>

<style lang="scss">
::-webkit-scrollbar {
  width: 12px;
}
::-webkit-scrollbar-track {
  background-color: #eee;
}
::-webkit-scrollbar-thumb {
  background-color: #ccc;
  border-radius: 8px;
}
@font-face {
  font-family: 'Cica';
  src: url('/Cica-Regular.ttf');
  font-weight: normal;
  font-style: normal;
}
@font-face {
  font-family: 'Cica';
  src: url('/Cica-Bold.ttf');
  font-weight: bold;
  font-style: normal;
}
@font-face {
  font-family: 'Cica';
  src: url('/Cica-RegularItalic.ttf');
  font-weight: normal;
  font-style: italic;
}
@font-face {
  font-family: 'Cica';
  src: url('/Cica-BoldItalic.ttf');
  font-weight: bold;
  font-style: italic;
}
body {
  font-family: 'Cica';
  width: 100vw;
  &::-webkit-scrollbar {
    width: 0;
  }
  #app {
    margin: 0;
    padding: 0;
    height: 100vh;
    width: 100vw;
    max-width: none;
    max-height: none;
    overflow: hidden;
    > .v-application > .v-application__wrap {
      display: flex;
      flex-direction: column;
      > * {
        width: 100%;
      }
      .titlebar {
        background-color: var(--titlebar);
        flex-shrink: 0;
        flex-grow: 0;
        height: 30px;
      }
      .main-component {
        flex-shrink: 1;
        min-height: 0;
        overflow: auto;
      }
    }
  }
}
</style>
