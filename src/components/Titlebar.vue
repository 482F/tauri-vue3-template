<template>
  <div data-tauri-drag-region class="titlebar">
    <div data-tauri-drag-region class="titles">
      <div data-tauri-drag-region class="left">{{ leftTitle }}</div>
      <div data-tauri-drag-region class="right">{{ rightTitle }}</div>
    </div>
    <div class="buttons">
      <button tabindex="-1" @click="() => appWindow.minimize()">
        <v-icon :icon="mdiWindowMinimize" />
      </button>
      <button tabindex="-1" @click="() => appWindow.close()">
        <v-icon :icon="mdiClose" />
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { appWindow } from '@tauri-apps/api/window'
import { mdiWindowMinimize, mdiClose } from '@mdi/js'

withDefaults(defineProps<{ leftTitle?: string; rightTitle?: string }>(), {
  leftTitle: 'left title',
  rightTitle: 'right title',
})
</script>

<style lang="scss" scoped>
.titlebar {
  user-select: none;
  cursor: default;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-left: 8px;
  gap: 8px;
  > * {
    height: 100%;
    align-items: center;
  }
  .titles {
    flex-grow: 1;
    flex-shrink: 1;
    display: flex;
    justify-content: space-between;
    overflow: hidden;
    gap: 16px;
    text-overflow: ellipsis;
    > .left {
      flex-shrink: 0;
      min-width: 0;
      max-width: 100%;
    }
    > * {
      text-overflow: ellipsis;
      overflow: hidden;
    }
  }
  .buttons {
    flex-shrink: 0;
    flex-grow: 0;
    display: flex;
    > button {
      height: 100%;
      padding: 0 8px;
      border-radius: 0;
      &:hover {
        background-color: #00000011;
      }
      &:focus {
        outline: none;
      }
    }
  }
}
</style>
