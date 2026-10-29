<template>
  <v-text-field
    :model-value="modelValue"
    type="number"
    @update:model-value="updateModelValueAndEmit"
  />
</template>

<script setup lang="ts">
import { isNil } from "lodash"

defineProps<{
  modelValue: number | null | undefined
}>()

const emit = defineEmits<{
  "update:modelValue": [value: number | null]
}>()

function updateModelValueAndEmit(newValue: number | string | null | undefined) {
  if (isNil(newValue) || newValue === "") {
    emit("update:modelValue", null)
    return
  }

  emit("update:modelValue", Number(newValue))
}
</script>
