<template>
  <v-text-field
    ref="inputRef"
    :model-value="formattedValue"
    :rules="transformedRules"
    type="text"
    @focus="onFocus"
    @blur="onBlur"
    @keydown.escape="resetValue"
    @keydown.enter="onEnter"
  />
</template>

<script setup lang="ts">
import Big from "big.js"
import { computed, ref, watch } from "vue"
import { CurrencyDisplay, type CurrencyInputOptions, useCurrencyInput } from "vue-currency-input"
import { isNil, isString } from "lodash"

type ValidationRule = (value: unknown) => boolean | string

const DEFAULT_OPTIONS = {
  currency: "CAD",
  locale: "en-CA",
  currencyDisplay: CurrencyDisplay.symbol,
  precision: 4,
  hideCurrencySymbolOnFocus: true,
}

const props = withDefaults(
  defineProps<{
    modelValue: number | string | null | undefined
    options?: Partial<CurrencyInputOptions>
    rules?: ValidationRule[]
  }>(),
  {
    options: () => ({}),
    rules: () => [],
  }
)

const emit = defineEmits(["update:modelValue"])

const initialNumberValue = ref(props.modelValue)

const { inputRef, numberValue, setValue, setOptions, formattedValue } = useCurrencyInput(
  {
    ...DEFAULT_OPTIONS,
    ...props.options,
  },
  false
)

// Validate against numberValue because formattedValue includes the currency symbol and separators.
const transformedRules = computed(() =>
  props.rules.map((rule) => {
    return () => rule(numberValue.value)
  })
)

watch(
  () => props.modelValue,
  (value) => {
    if (isNil(value)) {
      setValue(null)
    } else if (isString(value)) {
      const valueAsNumber = parseFloat(value)
      setValue(valueAsNumber)
    } else {
      setValue(value)
    }
  }
)

watch(
  () => props.options,
  (options) => {
    setOptions({
      ...DEFAULT_OPTIONS,
      ...options,
    })
  }
)

function onFocus() {
  initialNumberValue.value = props.modelValue
}

function onBlur() {
  if (numberValue.value === null) {
    resetValue()
    return
  }

  emit("update:modelValue", new Big(numberValue.value).toFixed(4))
}

function onEnter() {
  if (numberValue.value === null) {
    emit("update:modelValue", null)
    return
  }

  emit("update:modelValue", new Big(numberValue.value).toFixed(4))
}

function resetValue() {
  if (isNil(initialNumberValue.value)) {
    setValue(null)
  } else if (isString(initialNumberValue.value)) {
    const valueAsNumber = parseFloat(initialNumberValue.value)
    setValue(valueAsNumber)
  } else {
    setValue(initialNumberValue.value)
  }

  emit("update:modelValue", initialNumberValue.value)
}
</script>
