<template>
  <v-text-field
    ref="inputRef"
    :model-value="formattedValue"
    :rules="transformedRules"
    type="text"
    inputmode="decimal"
    @update:model-value="markAsEdited"
    @blur="commitInputValue"
    @keydown.escape.prevent="resetInputValue"
    @keydown.enter.prevent="commitInputValue"
  />
</template>

<script setup lang="ts">
import Big from "big.js"
import { computed, nextTick, onMounted, ref, watch } from "vue"
import { CurrencyDisplay, useCurrencyInput, type CurrencyInputOptions } from "vue-currency-input"

type ValidationRule = (value: unknown) => boolean | string

const MAXIMUM_AMOUNT = Big("99999999999.9999")
const MINIMUM_AMOUNT = MAXIMUM_AMOUNT.times("-1")

// The library uses Number internally; keep its adapter within DECIMAL(15,4)'s proven range.
const DEFAULT_OPTIONS: CurrencyInputOptions = {
  currency: "CAD",
  locale: "en-CA",
  currencyDisplay: CurrencyDisplay.symbol,
  precision: 4,
  hideCurrencySymbolOnFocus: true,
  autoDecimalDigits: false,
}

const props = withDefaults(
  defineProps<{
    modelValue: string | null | undefined
    options?: Partial<CurrencyInputOptions>
    rules?: ValidationRule[]
  }>(),
  {
    options: () => ({}),
    rules: () => [],
  }
)
const emit = defineEmits<{
  "update:modelValue": [value: string]
}>()

const committedValue = ref(normalizeModelValue(props.modelValue))
const hasUncommittedEdit = ref(false)

const { inputRef, numberValue, formattedValue, setOptions, setValue } = useCurrencyInput(
  getCurrencyInputOptions(props.options),
  false
)

const validationValue = computed(() => normalizeLibraryValue(numberValue.value, props.options))

const transformedRules = computed(() =>
  props.rules.map((rule) => {
    return () => rule(validationValue.value)
  })
)

onMounted(async () => {
  await nextTick()
  setValue(toLibraryValue(props.modelValue))
})

watch(
  () => props.modelValue,
  (value) => {
    committedValue.value = normalizeModelValue(value)
    hasUncommittedEdit.value = false
    setValue(toLibraryValue(value))
  }
)

watch(
  () => props.options,
  (options) => {
    setOptions(getCurrencyInputOptions(options))
  }
)

function markAsEdited() {
  hasUncommittedEdit.value = true
}

function commitInputValue() {
  if (!hasUncommittedEdit.value) {
    return
  }

  const decimalValue = normalizeLibraryValue(numberValue.value, props.options)
  if (decimalValue === null) {
    resetInputValue()
    return
  }

  hasUncommittedEdit.value = false
  if (decimalValue === committedValue.value) {
    return
  }

  committedValue.value = decimalValue
  setValue(toLibraryValue(decimalValue))
  emit("update:modelValue", decimalValue)
}

function resetInputValue() {
  hasUncommittedEdit.value = false
  setValue(toLibraryValue(committedValue.value))
}

function normalizeModelValue(value: string | null | undefined): string | null {
  if (value == null || value.trim() === "") {
    return null
  }

  try {
    return clampAmount(Big(value), props.options).toFixed(4)
  } catch {
    return null
  }
}

function normalizeLibraryValue(
  value: number | null,
  options: Partial<CurrencyInputOptions>
): string | null {
  if (value === null) {
    return null
  }

  try {
    return clampAmount(Big(value), options).toFixed(4)
  } catch {
    return null
  }
}

function toLibraryValue(value: string | null | undefined): number | null {
  const decimalValue = normalizeModelValue(value)
  return decimalValue === null ? null : Big(decimalValue).toNumber()
}

function clampAmount(value: Big, options: Partial<CurrencyInputOptions>): Big {
  const range = getBoundedValueRange(options)

  if (value.lt(range.min)) {
    return range.min
  }

  if (value.gt(range.max)) {
    return range.max
  }

  return value
}

function getBoundedValueRange(options: Partial<CurrencyInputOptions>) {
  let minimum = options.valueRange?.min === undefined ? MINIMUM_AMOUNT : Big(options.valueRange.min)
  let maximum = options.valueRange?.max === undefined ? MAXIMUM_AMOUNT : Big(options.valueRange.max)

  if (minimum.lt(MINIMUM_AMOUNT)) {
    minimum = MINIMUM_AMOUNT
  }

  if (minimum.gt(MAXIMUM_AMOUNT)) {
    minimum = MAXIMUM_AMOUNT
  }

  if (maximum.lt(MINIMUM_AMOUNT)) {
    maximum = MINIMUM_AMOUNT
  }

  if (maximum.gt(MAXIMUM_AMOUNT)) {
    maximum = MAXIMUM_AMOUNT
  }

  return { min: minimum, max: maximum }
}

function getCurrencyInputOptions(options: Partial<CurrencyInputOptions>): CurrencyInputOptions {
  const range = getBoundedValueRange(options)

  return {
    ...DEFAULT_OPTIONS,
    ...options,
    precision: 4,
    autoDecimalDigits: false,
    valueScaling: undefined,
    valueRange: {
      min: range.min.toNumber(),
      max: range.max.toNumber(),
    },
  }
}
</script>
