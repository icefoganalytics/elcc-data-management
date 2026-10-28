<template>
  <v-autocomplete
    :model-value="modelValue"
    :loading="isLoading"
    :items="allFundingPeriods"
    label="Funding Period"
    hint="Search for a funding period."
    item-title="fiscalYear"
    item-value="id"
    auto-select-first
    chips
    hide-selected
    no-filter
    @update:model-value="emit('update:modelValue', $event)"
    @update:search="debouncedUpdateSearchToken"
  >
    <template
      v-if="hasMore"
      #append-item
    >
      <v-divider />
      <v-list-item
        class="text-primary text-center"
        title="Show More"
        @click="nextPage"
      />
    </template>
    <template
      v-if="page > 1"
      #prepend-item
    >
      <v-list-item
        class="text-primary text-center"
        title="Show Less"
        @click="previousPage"
      />
      <v-divider />
    </template>
  </v-autocomplete>
</template>

<script setup lang="ts">
import { computed, onScopeDispose, ref, watch } from "vue"
import { debounce, isEmpty, isNil, uniqBy } from "lodash"

import useFundingPeriod from "@/use/use-funding-period"
import useFundingPeriods, {
  type FundingPeriodAsIndex,
  type FundingPeriodQueryOptions,
} from "@/use/use-funding-periods"

const props = defineProps<{
  modelValue: number | null
}>()

const emit = defineEmits<{
  "update:modelValue": [fundingPeriodId: number | null]
}>()

const fundingPeriodId = computed(() => props.modelValue)
const { fundingPeriod } = useFundingPeriod(fundingPeriodId)

const searchToken = ref("")
const page = ref(1)

function updateSearchToken(value: string) {
  searchToken.value = value
  page.value = 1
}

const debouncedUpdateSearchToken = debounce(updateSearchToken, 500)

const searchFilter = computed(() => {
  if (isEmpty(searchToken.value)) return {}

  return {
    search: searchToken.value.trim().split(" "),
  }
})

const perPage = computed(() => {
  if (isEmpty(searchToken.value)) return 100

  return 20
})

const fundingPeriodsQuery = computed<FundingPeriodQueryOptions>(() => ({
  filters: searchFilter.value,
  order: [["fiscalYear", "DESC"]],
  perPage: perPage.value,
  page: page.value,
}))
const { fundingPeriods, totalCount, isLoading, refresh } = useFundingPeriods(fundingPeriodsQuery)

const allFundingPeriods = computed<FundingPeriodAsIndex[]>(() => {
  if (isNil(fundingPeriodId.value) || isNil(fundingPeriod.value)) {
    return fundingPeriods.value
  }

  return uniqBy([...fundingPeriods.value, fundingPeriod.value], "id")
})

watch(
  fundingPeriods,
  (periods) => {
    if (isNil(props.modelValue) && periods.length > 0) {
      emit("update:modelValue", periods[0].id)
    }
  },
  { once: true }
)

async function reset() {
  debouncedUpdateSearchToken.cancel()
  searchToken.value = ""
  page.value = 1
  fundingPeriod.value = null
  await refresh()
}

watch(
  () => props.modelValue,
  async (newModelValue) => {
    if (isNil(newModelValue)) {
      await reset()
    }
  }
)

onScopeDispose(() => {
  debouncedUpdateSearchToken.cancel()
})

const hasMore = computed(() => page.value * perPage.value < totalCount.value)

function nextPage() {
  page.value += 1
}

function previousPage() {
  page.value -= 1
}
</script>
