<template>
  <v-select
    :model-value="modelValue"
    label="Funding Period"
    :items="fundingPeriods"
    item-title="fiscalYear"
    item-value="id"
    :loading="isLoading"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>

<script setup lang="ts">
import { ref, watch } from "vue"

import useFundingPeriods, { type FundingPeriodQueryOptions } from "@/use/use-funding-periods"

const props = defineProps<{
  modelValue: number | null
}>()

const emit = defineEmits<{
  "update:modelValue": [value: number | null]
}>()

const fundingPeriodsQuery = ref<FundingPeriodQueryOptions>({
  order: [["fiscalYear", "DESC"]],
  perPage: -1,
})
const { fundingPeriods, isLoading } = useFundingPeriods(fundingPeriodsQuery)

watch(fundingPeriods, (periods) => {
  if (props.modelValue === null && periods.length > 0) {
    emit("update:modelValue", periods[0].id)
  }
})
</script>
