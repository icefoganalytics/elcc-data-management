<template>
  <HeaderActionsCard>
    <template #header>
      <v-row align="center">
        <v-col
          cols="12"
          md="6"
        >
          <v-text-field
            :model-value="search"
            label="Search"
            append-inner-icon="mdi-magnify"
            density="compact"
            hide-details
            @update:model-value="debounceUpdateSearch"
          />
        </v-col>
        <v-col
          cols="12"
          md="6"
        >
          <v-select
            v-model="selectedFundingPeriodId"
            :items="fundingPeriodItems"
            label="Funding Period"
            :loading="isLoadingFundingPeriods"
            :error="isFundingPeriodsErrored"
            :error-messages="
              isFundingPeriodsErrored ? 'Unable to load funding periods.' : undefined
            "
            item-title="title"
            item-value="value"
            clearable
            no-data-text="No funding periods available"
          />
        </v-col>
      </v-row>
    </template>
    <template #header-actions>
      <v-btn
        color="primary"
        :to="{
          name: 'administration/child-care-space-categories/ChildCareSpaceCategoryNewPage',
        }"
      >
        <v-icon class="mr-3">mdi-plus</v-icon>
        New Child Care Space Category
      </v-btn>
    </template>

    <v-alert
      v-if="isFundingPeriodsErrored"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      Funding periods could not be loaded.
      <v-btn
        variant="text"
        @click="refreshFundingPeriods"
      >
        Try again
      </v-btn>
    </v-alert>
    <v-empty-state
      v-else-if="!isLoadingFundingPeriods && fundingPeriods.length === 0"
      class="ma-5"
      headline="No Funding Periods Found"
      title="Create a funding period before managing Child Care Space categories."
    />
    <ChildCareSpaceCategoriesDataTableServer
      v-else
      :where="childCareSpaceCategoriesWhere"
      :filters="childCareSpaceCategoriesFilters"
      :waiting="isLoadingFundingPeriods"
    />
  </HeaderActionsCard>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { debounce } from "lodash"

import { MAX_PER_PAGE } from "@/api/base-api"

import useBreadcrumbs from "@/use/use-breadcrumbs"
import useFundingPeriods, { type FundingPeriodQueryOptions } from "@/use/use-funding-periods"
import {
  type ChildCareSpaceCategoryFiltersOptions,
  type ChildCareSpaceCategoryWhereOptions,
} from "@/use/use-child-care-space-categories"

import HeaderActionsCard from "@/components/common/HeaderActionsCard.vue"
import ChildCareSpaceCategoriesDataTableServer from "@/components/child-care-space-categories/ChildCareSpaceCategoriesDataTableServer.vue"

const search = ref("")
const selectedFundingPeriodId = ref<number | null | undefined>(undefined)
const fundingPeriodsQuery = computed<FundingPeriodQueryOptions>(() => ({
  order: [["fiscalYear", "DESC"]],
  perPage: MAX_PER_PAGE,
}))
const {
  fundingPeriods,
  isLoading: isLoadingFundingPeriods,
  isErrored: isFundingPeriodsErrored,
  refresh: refreshFundingPeriods,
} = useFundingPeriods(fundingPeriodsQuery)

watch(
  fundingPeriods,
  (periods) => {
    if (selectedFundingPeriodId.value !== undefined && selectedFundingPeriodId.value !== null) {
      return
    }

    const latestFundingPeriod = periods[0]
    if (latestFundingPeriod) {
      selectedFundingPeriodId.value = latestFundingPeriod.id
    }
  },
  { immediate: true }
)

const fundingPeriodItems = computed(() =>
  fundingPeriods.value.map(({ id, fiscalYear, title }) => ({
    title: title ? `${fiscalYear} — ${title}` : fiscalYear,
    value: id,
  }))
)

function updateSearch(value: string | null) {
  search.value = value ?? ""
}

const debounceUpdateSearch = debounce(updateSearch, 500)

const childCareSpaceCategoriesWhere = computed<ChildCareSpaceCategoryWhereOptions>(() => {
  if (selectedFundingPeriodId.value === undefined || selectedFundingPeriodId.value === null) {
    return {}
  }

  return { fundingPeriodId: selectedFundingPeriodId.value }
})
const childCareSpaceCategoriesFilters = computed<ChildCareSpaceCategoryFiltersOptions>(() => {
  if (search.value === "") return {}

  return { search: search.value }
})

useBreadcrumbs("Child Care Space Categories", [
  {
    title: "Administration",
    to: {
      name: "AdministrationPage",
    },
  },
  {
    title: "Child Care Space Categories",
    to: {
      name: "administration/ChildCareSpaceCategoriesPage",
    },
  },
])
</script>
