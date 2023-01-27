<template>
  <v-app id="app">
    <Titlebar
      class="titlebar"
      :left-title="titles.left"
      :right-title="titles.right"
    />
    <MainComponent class="main-component" v-model:titles="titles" />
  </v-app>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MainComponent from './components/MainComponent.vue'
import Titlebar from './components/Titlebar.vue'

const titles = ref({
  left: 'tauri-vue3-template',
  right: '',
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
body {
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
        background-color: #ddd;
        flex-shrink: 0;
        flex-grow: 0;
        height: 30px;
      }
      .main-component {
        flex-grow: 1;
        flex-shrink: 1;
        min-height: 0;
        overflow: auto;
      }
    }
  }
}
</style>
