<template>
  <div>
    <v-checkbox
      :model-value="props.applyToFutureMonths"
      label="Apply to existing centre worksheets from a selected month onward"
      hide-details
      @update:model-value="updateApplyToFutureMonths"
    />

    <div
      v-if="props.applyToFutureMonths"
      class="mt-3"
    >
      <p class="text-body-2 mb-3">
        This applies only within the selected funding period. Earlier months, actuals, and manual
        overrides are preserved; other funding periods are not changed.
      </p>

      <v-alert
        v-if="hasFiscalPeriodError"
        type="error"
        variant="tonal"
        class="mb-3"
      >
        Months for this funding period could not be loaded. Reload the page to try again.
      </v-alert>
      <v-alert
        v-else-if="hasNoFiscalPeriods"
        type="warning"
        variant="tonal"
        class="mb-3"
      >
        No months are available for this funding period. Worksheet updates cannot be applied.
      </v-alert>

      <v-select
        :model-value="props.propagationStartFiscalPeriodId"
        :items="fiscalPeriodItems"
        label="Apply From Month *"
        :loading="isLoadingFiscalPeriods"
        :disabled="isNil(props.fundingPeriodId)"
        :error="hasFiscalPeriodError"
        :error-messages="hasFiscalPeriodError ? 'Unable to load months.' : undefined"
        :no-data-text="fiscalPeriodNoDataText"
        item-title="title"
        item-value="value"
        :rules="[validateApplyFromMonth]"
        required
        @update:model-value="updatePropagationStartFiscalPeriodId"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { isNil, upperFirst } from "lodash"

import { MAX_PER_PAGE } from "@/api/base-api"
import fiscalPeriodsApi, { type FiscalPeriod } from "@/api/fiscal-periods-api"
import { UnexpectedApiResponseError } from "@/api/errors/unexpected-api-response-error"

const props = defineProps<{
  fundingPeriodId: number | null | undefined
  applyToFutureMonths: boolean
  propagationStartFiscalPeriodId: number | null
}>()

const emit = defineEmits<{
  "update:applyToFutureMonths": [value: boolean]
  "update:propagationStartFiscalPeriodId": [value: number | null]
}>()

const fiscalPeriods = ref<FiscalPeriod[]>([])
const isLoadingFiscalPeriods = ref(false)
const isFiscalPeriodsErrored = ref(false)
const fiscalPeriodItems = computed(() =>
  fiscalPeriods.value
    .filter(({ fundingPeriodId }) => fundingPeriodId === props.fundingPeriodId)
    .map(({ id, fiscalYear, month }) => ({
      title: `${upperFirst(month)} — ${fiscalYear}`,
      value: id,
    }))
)
const hasFiscalPeriodError = computed(
  () =>
    !isNil(props.fundingPeriodId) && !isLoadingFiscalPeriods.value && isFiscalPeriodsErrored.value
)
const hasNoFiscalPeriods = computed(
  () =>
    props.applyToFutureMonths &&
    !isNil(props.fundingPeriodId) &&
    !isLoadingFiscalPeriods.value &&
    !hasFiscalPeriodError.value &&
    fiscalPeriodItems.value.length === 0
)
const fiscalPeriodNoDataText = computed(() => {
  if (isNil(props.fundingPeriodId)) {
    return "Select a funding period first"
  }

  if (isLoadingFiscalPeriods.value) {
    return "Loading months..."
  }

  if (hasFiscalPeriodError.value) {
    return "Unable to load months"
  }

  return "No months available for this funding period"
})

let latestFiscalPeriodsRequest = 0

watch(
  [() => props.fundingPeriodId, () => props.applyToFutureMonths],
  async ([fundingPeriodId, applyToFutureMonths]) => {
    const requestId = ++latestFiscalPeriodsRequest

    if (!applyToFutureMonths || isNil(fundingPeriodId)) {
      fiscalPeriods.value = []
      isLoadingFiscalPeriods.value = false
      isFiscalPeriodsErrored.value = false
      return
    }

    await loadFiscalPeriods(fundingPeriodId, requestId)
  },
  { immediate: true }
)

watch(
  () => props.fundingPeriodId,
  () => emit("update:propagationStartFiscalPeriodId", null)
)

async function loadFiscalPeriods(fundingPeriodId: number, requestId: number) {
  fiscalPeriods.value = []
  isLoadingFiscalPeriods.value = true
  isFiscalPeriodsErrored.value = false

  try {
    const { fiscalPeriods: loadedFiscalPeriods } = await fiscalPeriodsApi.list({
      where: { fundingPeriodId },
      perPage: MAX_PER_PAGE,
      order: [["dateStart", "ASC"]],
    })

    if (requestId !== latestFiscalPeriodsRequest) {
      return
    }

    fiscalPeriods.value = loadedFiscalPeriods
  } catch (error) {
    if (requestId !== latestFiscalPeriodsRequest) {
      if (error instanceof UnexpectedApiResponseError) throw error
      return
    }

    console.error(`Failed to load fiscal months for funding period ${fundingPeriodId}: ${error}`, {
      error,
    })
    isFiscalPeriodsErrored.value = true
    if (error instanceof UnexpectedApiResponseError) throw error
  } finally {
    if (requestId === latestFiscalPeriodsRequest) {
      isLoadingFiscalPeriods.value = false
    }
  }
}

function updateApplyToFutureMonths(value: boolean | null) {
  const isEnabled = value === true
  emit("update:applyToFutureMonths", isEnabled)

  if (!isEnabled) {
    emit("update:propagationStartFiscalPeriodId", null)
  }
}

function updatePropagationStartFiscalPeriodId(value: number | null) {
  emit("update:propagationStartFiscalPeriodId", value)
}

function validateApplyFromMonth(value: unknown): boolean | string {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    return "Select an Apply From Month"
  }

  const belongsToSelectedFundingPeriod = fiscalPeriods.value.some(
    ({ id, fundingPeriodId }) => id === value && fundingPeriodId === props.fundingPeriodId
  )
  if (!belongsToSelectedFundingPeriod) {
    return "Select a month from the selected funding period"
  }

  return true
}
</script>
