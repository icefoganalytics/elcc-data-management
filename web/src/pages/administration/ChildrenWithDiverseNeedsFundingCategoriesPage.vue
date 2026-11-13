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
          name: 'administration/children-with-diverse-needs-funding-categories/ChildrenWithDiverseNeedsFundingCategoryNewPage',
          query: {
            fundingPeriodId,
          },
        }"
      >
        <v-icon class="mr-3">mdi-plus</v-icon>
        New Category
      </v-btn>
    </template>

    <ChildrenWithDiverseNeedsFundingCategoriesDataTableServer
      :where="childrenWithDiverseNeedsFundingCategoriesWhere"
      :filters="childrenWithDiverseNeedsFundingCategoriesFilters"
    />
  </HeaderActionsCard>
</template>

<script setup lang="ts">
import { computed, onScopeDispose, ref } from "vue"
import { debounce } from "lodash"

import type { ChildrenWithDiverseNeedsFundingCategoryFiltersOptions } from "@/api/children-with-diverse-needs-funding-categories-api"

import useBreadcrumbs from "@/use/use-breadcrumbs"
import useFundingPeriods from "@/use/use-funding-periods"

import ChildrenWithDiverseNeedsFundingCategoriesDataTableServer from "@/components/children-with-diverse-needs-funding-categories/ChildrenWithDiverseNeedsFundingCategoriesDataTableServer.vue"
import FundingPeriodSearchableAutocomplete from "@/components/funding-periods/FundingPeriodSearchableAutocomplete.vue"
import HeaderActionsCard from "@/components/common/HeaderActionsCard.vue"

const search = ref("")

function updateSearch(value: string) {
  search.value = value
}

const debounceUpdateSearch = debounce(updateSearch, 500)

onScopeDispose(() => {
  debounceUpdateSearch.cancel()
})

const childrenWithDiverseNeedsFundingCategoriesFilters =
  computed<ChildrenWithDiverseNeedsFundingCategoryFiltersOptions>(() => {
    if (search.value === "") return {}

    return {
      search: search.value,
    }
  })

const fundingPeriodsQuery = ref({
  perPage: 1,
})
const { totalCount: fundingPeriodsCount } = useFundingPeriods(fundingPeriodsQuery)

const fundingPeriodId = ref<number | null>(null)

const childrenWithDiverseNeedsFundingCategoriesWhere = computed(() => ({
  fundingPeriodId: fundingPeriodId.value ?? undefined,
}))

useBreadcrumbs("Diverse Need Categories", [
  {
    title: "Administration",
    to: {
      name: "AdministrationPage",
    },
  },
  {
    title: "Diverse Need Categories",
    to: {
      name: "administration/ChildrenWithDiverseNeedsFundingCategoriesPage",
    },
  },
])
</script>
