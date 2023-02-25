<template>
  <div class="label">{{ label }}:&nbsp;</div>
  <div v-if="typeof modelValue === 'number'" class="number-form">
    <a-text-field
      :model-value="modelValue"
      @update:model-value="$emit('update:model-value', Math.round($event))"
    />
    <a-slider
      :model-value="modelValue"
      @update:model-value="$emit('update:model-value', Math.round($event))"
    />
  </div>
  <div v-else-if="typeof modelValue === 'string'">
    <a-text-field
      :model-value="modelValue"
      @update:model-value="$emit('update:model-value', $event)"
    />
  </div>
  <div v-else-if="typeof modelValue === 'boolean'">
    <a-switch
      :model-value="modelValue"
      @update:model-value="$emit('update:model-value', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import ATextField from '../atoms/a-text-field.vue'
import ASlider from '../atoms/a-slider.vue'
import ASwitch from '../atoms/a-switch.vue'

defineProps<{ modelValue: number | string | boolean; label: string }>()
</script>

<style lang="scss" scoped>
.number-form {
  display: grid;
  grid-template-columns: 100px 1fr;
  align-items: center;
  gap: 16px;
}
</style>
