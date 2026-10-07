<template>
  <v-text-field
    :model-value="displayValue"
    :rules="transformedRules"
    type="text"
    inputmode="decimal"
    @update:model-value="updateInputValue"
    @focus="startEditing"
    @blur="commitInputValue"
    @keydown.escape="resetInputValue"
    @keydown.enter.prevent="commitInputValueWhileEditing"
  />
</template>

<script setup lang="ts">
import Big from "big.js"
import { isNil } from "lodash"
import { computed, ref, watch } from "vue"

import { formatMoney } from "@/utils/formatters"

type ValidationRule = (value: unknown) => boolean | string

const props = withDefaults(
  defineProps<{
    modelValue: string | null | undefined
    rules?: ValidationRule[]
  }>(),
  {
    rules: () => [],
  }
)
const emit = defineEmits<{
  "update:modelValue": [value: string]
}>()

const isEditing = ref(false)
const inputValue = ref(props.modelValue ?? "")

const transformedRules = computed(() =>
  props.rules.map((rule) => {
    return () => rule(inputValue.value)
  })
)

const displayValue = computed(() => {
  if (isEditing.value) {
    return inputValue.value
  }

  if (isNil(props.modelValue) || props.modelValue === "") {
    return ""
  }

  return formatMoney(props.modelValue)
})

watch(
  () => props.modelValue,
  (value) => {
    if (isEditing.value) {
      return
    }

    inputValue.value = value ?? ""
  }
)

function updateInputValue(value: string | null) {
  inputValue.value = value ?? ""
}

function startEditing() {
  isEditing.value = true
  inputValue.value = props.modelValue ?? ""
}

function commitInputValue() {
  const decimalValue = normalizeInputValue()

  if (decimalValue === undefined) {
    return
  }

  isEditing.value = false
  emit("update:modelValue", decimalValue)
}

function commitInputValueWhileEditing() {
  const decimalValue = normalizeInputValue()

  if (decimalValue === undefined) {
    return
  }

  emit("update:modelValue", decimalValue)
}

function normalizeInputValue(): string | undefined {
  if (inputValue.value === "") {
    resetInputValue()
    return
  }

  try {
    const decimalValue = Big(inputValue.value).toFixed(4)

    inputValue.value = decimalValue
    return decimalValue
  } catch {
    resetInputValue()
  }
}

function resetInputValue() {
  inputValue.value = props.modelValue ?? ""
}
</script>
