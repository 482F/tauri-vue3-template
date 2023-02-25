<template>
  <div class="label">{{ label }}:&nbsp;</div>
  <div v-if="typeof modelValue === 'number'" class="number-form">
    <ATextField
      :model-value="modelValue"
      @update:model-value="$emit('update:model-value', Math.round($event))"
    />
    <ASlider
      :model-value="modelValue"
      @update:model-value="$emit('update:model-value', Math.round($event))"
    />
  </div>
  <div v-else-if="typeof modelValue === 'string'">
    <ATextField
      :model-value="modelValue"
      @update:model-value="$emit('update:model-value', $event)"
    />
  </div>
  <div v-else-if="typeof modelValue === 'boolean'">
    <ASwitch
      :model-value="modelValue"
      @update:model-value="$emit('update:model-value', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import ATextField from '../atoms/ATextField.vue'
import ASlider from '../atoms/ASlider.vue'
import ASwitch from '../atoms/ASwitch.vue'

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
