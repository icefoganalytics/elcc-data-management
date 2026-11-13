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
          md="6"
          class="pb-4 pb-md-0 pr-md-4"
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
          <FundingPeriodSearchableAutocomplete
            v-model="selectedFundingPeriodId"
            label="Funding Period"
            density="compact"
            hide-details
            clearable
          />
        </v-col>
      </v-row>
    </template>
    <template #header-actions>
      <v-btn
        v-if="
          isSystemAdmin &&
          !isLoadingFundingPeriods &&
          !isFundingPeriodsErrored &&
          fundingPeriods.length > 0
        "
        color="primary"
        :to="{
          name: 'administration/quality-enhancement-categories/QualityEnhancementCategoryNewPage',
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
import { computed, onScopeDispose, ref } from "vue"
import { debounce, isNil } from "lodash"

import useBreadcrumbs from "@/use/use-breadcrumbs"
import useCurrentUser from "@/use/use-current-user"
import useFundingPeriods, { type FundingPeriodQueryOptions } from "@/use/use-funding-periods"
import {
  type QualityEnhancementCategoryFiltersOptions,
  type QualityEnhancementCategoryWhereOptions,
} from "@/use/use-quality-enhancement-categories"

import HeaderActionsCard from "@/components/common/HeaderActionsCard.vue"
import QualityEnhancementCategoriesDataTableServer from "@/components/quality-enhancement-categories/QualityEnhancementCategoriesDataTableServer.vue"
import FundingPeriodSearchableAutocomplete from "@/components/funding-periods/FundingPeriodSearchableAutocomplete.vue"

const { isSystemAdmin } = useCurrentUser()

const search = ref("")
const selectedFundingPeriodId = ref<number | null | undefined>(undefined)
const fundingPeriodsQuery = computed<FundingPeriodQueryOptions>(() => ({
  order: [["fiscalYear", "DESC"]],
  perPage: 1,
}))
const {
  fundingPeriods,
  isLoading: isLoadingFundingPeriods,
  isErrored: isFundingPeriodsErrored,
  refresh: refreshFundingPeriods,
} = useFundingPeriods(fundingPeriodsQuery)

function updateSearch(value: string | null) {
  search.value = value ?? ""
}

const debounceUpdateSearch = debounce(updateSearch, 500)

onScopeDispose(() => debounceUpdateSearch.cancel())

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
