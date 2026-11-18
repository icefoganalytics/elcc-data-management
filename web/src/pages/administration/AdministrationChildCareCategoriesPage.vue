<template>
  <HeaderActionsCard>
    <template #header>
      <v-row
        align="center"
        class="ma-0 mr-md-4"
        no-gutters
      >
        <v-col
          cols="12"
          md="8"
          class="pb-4 pb-md-0 pr-md-4"
        >
          <FilterSearchDebouncedTextField v-model="search" />
        </v-col>
        <v-col
          cols="12"
          md="4"
        >
          <v-select
            v-model="selectedFundingPeriodId"
            :items="fundingPeriodItems"
            label="Funding Period"
            density="compact"
            hide-details
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
        v-if="isSystemAdmin"
        color="primary"
        :to="{
          name: 'administration/child-care-categories/ChildCareCategoryNewPage',
        }"
      >
        <v-icon class="mr-3">mdi-plus</v-icon>
        New Category
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
      title="Create a funding period before managing Child Care categories."
    />
    <ChildCareCategoriesDataTableServer
      v-else
      :where="childCareCategoriesWhere"
      :filters="childCareCategoriesFilters"
      :waiting="isLoadingFundingPeriods"
    />
  </HeaderActionsCard>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { isNil } from "lodash"

import { MAX_PER_PAGE } from "@/api/base-api"

import useCurrentUser from "@/use/use-current-user"
import useBreadcrumbs from "@/use/use-breadcrumbs"
import useFundingPeriods, { type FundingPeriodQueryOptions } from "@/use/use-funding-periods"
import {
  type ChildCareCategoryFiltersOptions,
  type ChildCareCategoryWhereOptions,
} from "@/use/use-child-care-categories"

import HeaderActionsCard from "@/components/common/HeaderActionsCard.vue"
import FilterSearchDebouncedTextField from "@/components/common/tables/FilterSearchDebouncedTextField.vue"
import ChildCareCategoriesDataTableServer from "@/components/child-care-categories/ChildCareCategoriesDataTableServer.vue"

const { isSystemAdmin } = useCurrentUser()

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
    if (!isNil(selectedFundingPeriodId.value)) {
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
  fundingPeriods.value.map(({ id, fiscalYear, title: periodTitle }) => {
    const title = periodTitle ? `${fiscalYear} — ${periodTitle}` : fiscalYear
    const value = id

    return { title, value }
  })
)

const childCareCategoriesWhere = computed<ChildCareCategoryWhereOptions>(() => {
  if (isNil(selectedFundingPeriodId.value)) {
    return {}
  }

  return { fundingPeriodId: selectedFundingPeriodId.value }
})
const childCareCategoriesFilters = computed<ChildCareCategoryFiltersOptions>(() => {
  if (search.value === "") {
    return {}
  }

  return { search: search.value }
})

useBreadcrumbs("Child Care Categories", [
  {
    title: "Administration",
    to: {
      name: "AdministrationPage",
    },
  },
  {
    title: "Child Care Categories",
    to: {
      name: "administration/ChildCareCategoriesPage",
    },
  },
])
</script>
