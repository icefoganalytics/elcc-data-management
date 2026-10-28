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
    <v-data-table
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
import { computed, ref } from "vue"
import { useRouter } from "vue-router"

import { formatMoney } from "@/utils/formatters"

import useAdministrationCostCategories from "@/use/use-administration-cost-categories"
import useBreadcrumbs from "@/use/use-breadcrumbs"
import useFundingPeriods from "@/use/use-funding-periods"

import HeaderActionsCard from "@/components/common/HeaderActionsCard.vue"
import FundingPeriodSearchableAutocomplete from "@/components/funding-periods/FundingPeriodSearchableAutocomplete.vue"

const router = useRouter()

const { totalCount: fundingPeriodsCount } = useFundingPeriods(
  ref({
    perPage: 1,
  })
)

const fundingPeriodId = ref<number | null>(null)

const administrationCostCategoriesWhere = computed(() => ({
  fundingPeriodId: fundingPeriodId.value ?? undefined,
}))
const administrationCostCategoriesQuery = computed(() => ({
  where: administrationCostCategoriesWhere.value,
  perPage: -1,
}))
const { administrationCostCategories, isLoading } = useAdministrationCostCategories(
  administrationCostCategoriesQuery
)

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
