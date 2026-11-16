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
          name: 'administration/building-expense-categories/BuildingExpenseCategoryNewPage',
        }"
      >
        <v-icon class="mr-3">mdi-plus</v-icon>
        New Category
      </v-btn>
    </template>

    <BuildingExpenseCategoriesDataTableServer :filters="buildingExpenseCategoriesFilters" />
  </HeaderActionsCard>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"

import useBreadcrumbs from "@/use/use-breadcrumbs"
import { type BuildingExpenseCategoryFiltersOptions } from "@/use/use-building-expense-categories"

import HeaderActionsCard from "@/components/common/HeaderActionsCard.vue"
import FilterSearchDebouncedTextField from "@/components/common/tables/FilterSearchDebouncedTextField.vue"
import BuildingExpenseCategoriesDataTableServer from "@/components/building-expense-categories/BuildingExpenseCategoriesDataTableServer.vue"

const search = ref("")

const buildingExpenseCategoriesFilters = computed(() => {
  const filters: BuildingExpenseCategoryFiltersOptions = {}

  if (search.value) {
    filters.search = search.value
  }

  return filters
})

useBreadcrumbs("Building Expense Categories", [
  {
    title: "Administration",
    to: {
      name: "AdministrationPage",
    },
  },
  {
    title: "Building Expense Categories",
    to: {
      name: "administration/BuildingExpenseCategoriesPage",
    },
  },
])
</script>
