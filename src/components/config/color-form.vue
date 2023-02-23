<template>
  <div class="label">{{ label }}:&nbsp;</div>
  <div class="color-form">
    <div
      class="color-sample"
      :style="{ '--bg-color': modelValue }"
      ref="colorSample"
    ></div>
    <v-menu :close-on-content-click="false" :min-width="0">
      <template v-slot:activator="{ props }">
        <a-text-field
          :model-value="modelValue"
          @update:model-value="$emit('update:model-value', $event)"
          v-bind="props"
        />
      </template>
      <v-color-picker
        mode="rgb"
        :modes="['rgb', 'hex']"
        :model-value="colorPickerValue"
        @update:model-value="$emit('update:model-value', $event)"
      />
    </v-menu>
  </div>
</template>

<script setup lang="ts">
import ATextField from '../atoms/a-text-field.vue'
import { ref, Ref, computed } from 'vue'

const props = defineProps<{ modelValue: string; label: string }>()

const colorSample: Ref<Element | undefined> = ref()
const colorPickerValue = computed(() => {
  const defaultValue = '#FFFFFF'
  if (props.modelValue[0] === '#') {
    return props.modelValue.slice(0, 7)
  } else if (colorSample.value) {
    const [r, g, b] = (
      getComputedStyle(colorSample.value)
        .backgroundColor.match(/(\d+), (\d+), (\d+)/)
        ?.slice(1) ?? []
    ).map((v) => Number(v).toString(16).padStart(2, '0'))
    console.log({ r, g, b })
    if ([r, g, b].some((v) => [undefined, 'NaN'].includes(v))) {
      return defaultValue
    }
    return `#${r}${g}${b}`
  }
  return defaultValue
})
</script>

<style lang="scss" scoped>
.color-form {
  display: grid;
  grid-template-columns: 32px 1fr;
  align-items: center;
  gap: 8px;
  > .color-sample {
    background-color: var(--bg-color);
    padding-top: 100%;
    border-radius: 4px;
  }
}
</style>
