<template>
  <HeaderActionsCard>
    <template #header>
      <FilterSearchDebouncedTextField
        v-model="search"
        class="mr-md-4"
      />
    </template>
    <template #header-actions>
      <v-btn
        color="primary"
        :to="{
          name: 'administration/funding-regions/FundingRegionNewPage',
        }"
      >
        <v-icon class="mr-3">mdi-plus</v-icon>
        New Funding Region
      </v-btn>
    </template>

    <FundingRegionsDataTableServer :filters="fundingRegionsFilters" />
  </HeaderActionsCard>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"

import useBreadcrumbs from "@/use/use-breadcrumbs"
import { type FundingRegionFiltersOptions } from "@/use/use-funding-regions"

import HeaderActionsCard from "@/components/common/HeaderActionsCard.vue"
import FilterSearchDebouncedTextField from "@/components/common/tables/FilterSearchDebouncedTextField.vue"
import FundingRegionsDataTableServer from "@/components/funding-regions/FundingRegionsDataTableServer.vue"

const search = ref("")

const fundingRegionsFilters = computed(() => {
  const filters: FundingRegionFiltersOptions = {}

  if (search.value) {
    filters.search = search.value
  }

  return filters
})

useBreadcrumbs("Funding Regions", [
  {
    title: "Administration",
    to: {
      name: "AdministrationPage",
    },
  },
  {
    title: "Funding Regions",
    to: {
      name: "administration/FundingRegionsPage",
    },
  },
])
</script>
