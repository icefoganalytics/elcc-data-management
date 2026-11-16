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
          <FundingPeriodSearchableAutocomplete
            v-model="fundingPeriodId"
            density="compact"
            hide-details
            clearable
          />
        </v-col>
      </v-row>
    </template>
    <template #header-actions>
      <v-btn
        v-if="fundingPeriodsCount > 0"
        color="primary"
        :to="{
          name: 'administration/administration-cost-categories/AdministrationCostCategoryNewPage',
        }"
      >
        <v-icon class="mr-3">mdi-plus</v-icon>
        New Category
      </v-btn>
    </template>

    <AdministrationCostCategoriesDataTableServer
      :where="administrationCostCategoriesWhere"
      :filters="administrationCostCategoriesFilters"
    />
  </HeaderActionsCard>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"

import type { AdministrationCostCategoryFiltersOptions } from "@/api/administration-cost-categories-api"

import useBreadcrumbs from "@/use/use-breadcrumbs"
import useFundingPeriods from "@/use/use-funding-periods"

import AdministrationCostCategoriesDataTableServer from "@/components/administration-cost-categories/AdministrationCostCategoriesDataTableServer.vue"
import HeaderActionsCard from "@/components/common/HeaderActionsCard.vue"
import FilterSearchDebouncedTextField from "@/components/common/tables/FilterSearchDebouncedTextField.vue"
import FundingPeriodSearchableAutocomplete from "@/components/funding-periods/FundingPeriodSearchableAutocomplete.vue"

const search = ref("")

const administrationCostCategoriesFilters = computed<AdministrationCostCategoryFiltersOptions>(
  () => {
    if (search.value === "") return {}

    return {
      search: search.value,
    }
  }
)

const fundingPeriodsQuery = ref({
  perPage: 1,
})
const { totalCount: fundingPeriodsCount } = useFundingPeriods(fundingPeriodsQuery)

const fundingPeriodId = ref<number | null>(null)

const administrationCostCategoriesWhere = computed(() => {
  return {
    fundingPeriodId: fundingPeriodId.value ?? undefined,
  }
})

useBreadcrumbs("Administration Cost Categories", [
  {
    title: "Administration",
    to: {
      name: "AdministrationPage",
    },
  },
  {
    title: "Administration Cost Categories",
    to: {
      name: "administration/AdministrationCostCategoriesPage",
    },
  },
])
</script>
