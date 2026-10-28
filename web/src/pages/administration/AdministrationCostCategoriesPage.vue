<template>
  <HeaderActionsCard title="Administration Cost Categories">
    <template #header-actions>
      <v-btn
        color="primary"
        :to="{
          name: 'administration/administration-cost-categories/AdministrationCostCategoryNewPage',
        }"
      >
        <v-icon class="mr-2">mdi-plus</v-icon>
        New Administration Cost Category
      </v-btn>
    </template>
    <v-select
      v-model="selectedFundingPeriodId"
      label="Funding Period"
      :items="fundingPeriods"
      item-title="fiscalYear"
      item-value="id"
      clearable
      :loading="isLoadingFundingPeriods"
      :error="isFundingPeriodsErrored"
      :error-messages="isFundingPeriodsErrored ? 'Funding periods could not be loaded.' : undefined"
    />
    <v-alert
      v-if="isErrored"
      type="error"
      variant="tonal"
    >
      Administration cost categories could not be loaded.
      <v-btn
        variant="outlined"
        @click="fetch"
        >Retry</v-btn
      >
    </v-alert>
    <v-data-table
      v-else
      :headers="headers"
      :items="administrationCostCategories"
      :loading="isLoading"
      @click:row="openCategory"
    >
      <template #item.monthlyAmount="{ item }">
        {{
          formatMoney(item.monthlyAmount, {
            maximumFractionDigits: 4,
          })
        }}
      </template>
    </v-data-table>
  </HeaderActionsCard>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useRouter } from "vue-router"

import { formatMoney } from "@/utils/formatters"
import useFundingPeriods, { type FundingPeriodQueryOptions } from "@/use/use-funding-periods"
import useAdministrationCostCategories from "@/use/use-administration-cost-categories"
import HeaderActionsCard from "@/components/common/HeaderActionsCard.vue"
import useBreadcrumbs from "@/use/use-breadcrumbs"

const router = useRouter()

const fundingPeriodsQuery = ref<FundingPeriodQueryOptions>({
  order: [["fiscalYear", "DESC"]],
  perPage: -1,
})
const {
  fundingPeriods,
  isLoading: isLoadingFundingPeriods,
  isErrored: isFundingPeriodsErrored,
} = useFundingPeriods(fundingPeriodsQuery)

const selectedFundingPeriodId = ref<number | null>(null)
const query = computed(() => ({
  where: selectedFundingPeriodId.value
    ? {
        fundingPeriodId: selectedFundingPeriodId.value,
      }
    : {},
  perPage: -1,
}))
const { administrationCostCategories, isLoading, isErrored, fetch } =
  useAdministrationCostCategories(query)

const headers = [
  {
    title: "Category Name",
    key: "categoryName",
  },
  {
    title: "From Age",
    key: "fromAge",
  },
  {
    title: "To Age",
    key: "toAge",
  },
  {
    title: "Monthly Amount",
    key: "monthlyAmount",
  },
]

watch(fundingPeriods, (periods) => {
  if (selectedFundingPeriodId.value === null && periods.length > 0) {
    selectedFundingPeriodId.value = periods[0].id
  }
})

function openCategory(_event: Event, { item }: { item: { id: number } }) {
  router.push({
    name: "administration/administration-cost-categories/AdministrationCostCategoryPage",
    params: {
      administrationCostCategoryId: item.id,
    },
  })
}

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
