<template>
  <v-skeleton-loader
    v-if="isLoading"
    type="image"
    color="transparent"
  />
  <VueApexCharts
    v-else-if="hasActualChildOccupancyRates"
    height="300"
    type="pie"
    :options="options"
    :series="actualChildOccupancyRates"
  />
  <v-empty-state
    v-else
    text="No enrollment data available"
  />
</template>

<script setup lang="ts">
import { computed } from "vue"
import { isNil } from "lodash"
import Big from "big.js"

import VueApexCharts from "vue3-apexcharts"

import useChildCareSpaces, { type ChildCareSpaceQueryOptions } from "@/use/use-child-care-spaces"
import { normalizeFiscalYearToShortForm } from "@/utils/fiscal-year"

const props = defineProps<{
  centreId: number
  fiscalYear: string
}>()

const childCareSpacesQuery = computed<ChildCareSpaceQueryOptions>(() => ({
  where: {
    centreId: props.centreId,
  },
  filters: {
    byFiscalYear: normalizeFiscalYearToShortForm(props.fiscalYear),
  },
  order: [
    ["fiscalPeriod", "dateStart", "DESC"],
    ["categoryId", "ASC"],
  ],
  perPage: -1,
}))
const { childCareSpaces, isLoading, refresh } = useChildCareSpaces(childCareSpacesQuery)

const latestFiscalPeriodId = computed(
  () =>
    childCareSpaces.value.find((childCareSpace) =>
      Big(childCareSpace.actualChildOccupancyRate).gt(0)
    )?.fiscalPeriodId
)
const latestChildCareSpaces = computed(() => {
  if (isNil(latestFiscalPeriodId.value)) return []

  return childCareSpaces.value.filter(
    ({ fiscalPeriodId }) => fiscalPeriodId === latestFiscalPeriodId.value
  )
})

const lineNames = computed(() =>
  latestChildCareSpaces.value.map((childCareSpace) => childCareSpace.lineName)
)
const options = computed(() => ({
  stroke: {
    show: false,
  },
  colors: ["#D81B60", "#002EB7", "#FFAE00", "#FF7A00", "#00A0C6", "#A65000", "#1851FC"],
  labels: lineNames.value,
  tooltip: {
    theme: "light",
    fillSeriesColor: false,
  },
}))

const actualChildOccupancyRates = computed(() => {
  return latestChildCareSpaces.value.map((childCareSpace) =>
    Number(childCareSpace.actualChildOccupancyRate)
  )
})

const hasActualChildOccupancyRates = computed(() =>
  actualChildOccupancyRates.value.some((value) => Big(value).gt(0))
)

defineExpose({
  refresh,
})
</script>
