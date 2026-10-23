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
          name: 'administration/quality-enhancement-categories/QualityEnhancementCategoryNewPage',
        }"
      >
        <v-icon class="mr-3">mdi-plus</v-icon>
        New Quality Enhancement Category
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
      title="Create a funding period before managing Quality Enhancement categories."
    />
    <QualityEnhancementCategoriesDataTableServer
      v-else
      :where="qualityEnhancementCategoriesWhere"
      :filters="qualityEnhancementCategoriesFilters"
      :waiting="isLoadingFundingPeriods"
    />
  </HeaderActionsCard>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { debounce, isNil } from "lodash"

import { MAX_PER_PAGE } from "@/api/base-api"

import useBreadcrumbs from "@/use/use-breadcrumbs"
import useFundingPeriods, { type FundingPeriodQueryOptions } from "@/use/use-funding-periods"
import {
  type QualityEnhancementCategoryFiltersOptions,
  type QualityEnhancementCategoryWhereOptions,
} from "@/use/use-quality-enhancement-categories"

import HeaderActionsCard from "@/components/common/HeaderActionsCard.vue"
import QualityEnhancementCategoriesDataTableServer from "@/components/quality-enhancement-categories/QualityEnhancementCategoriesDataTableServer.vue"

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

function updateSearch(value: string | null) {
  search.value = value ?? ""
}

const debounceUpdateSearch = debounce(updateSearch, 500)

const qualityEnhancementCategoriesWhere = computed<QualityEnhancementCategoryWhereOptions>(() => {
  if (isNil(selectedFundingPeriodId.value)) {
    return {}
  }

  return { fundingPeriodId: selectedFundingPeriodId.value }
})
const qualityEnhancementCategoriesFilters = computed<QualityEnhancementCategoryFiltersOptions>(
  () => {
    if (search.value === "") {
      return {}
    }

    return { search: search.value }
  }
)

useBreadcrumbs("Quality Enhancement Categories", [
  {
    title: "Administration",
    to: {
      name: "AdministrationPage",
    },
  },
  {
    title: "Quality Enhancement Categories",
    to: {
      name: "administration/QualityEnhancementCategoriesPage",
    },
  },
])
</script>
