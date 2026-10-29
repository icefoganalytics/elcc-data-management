<template>
  <HeaderActionsCard title="Administration Cost Categories">
    <template #header-actions>
      <v-btn
        v-if="fundingPeriodsCount > 0"
        color="primary"
        :to="{
          name: 'administration/administration-cost-categories/AdministrationCostCategoryNewPage',
        }"
      >
        <v-icon class="mr-2">mdi-plus</v-icon>
        New Administration Cost Category
      </v-btn>
    </template>
    <FundingPeriodSearchableAutocomplete
      v-model="fundingPeriodId"
      clearable
    />
    <AdministrationCostCategoriesDataTableServer :where="administrationCostCategoriesWhere" />
  </HeaderActionsCard>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"

import useBreadcrumbs from "@/use/use-breadcrumbs"
import useFundingPeriods from "@/use/use-funding-periods"

import AdministrationCostCategoriesDataTableServer from "@/components/administration-cost-categories/AdministrationCostCategoriesDataTableServer.vue"
import HeaderActionsCard from "@/components/common/HeaderActionsCard.vue"
import FundingPeriodSearchableAutocomplete from "@/components/funding-periods/FundingPeriodSearchableAutocomplete.vue"

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
