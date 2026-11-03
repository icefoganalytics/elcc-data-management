<template>
  <HeaderActionsCard title="Diverse Need Categories">
    <template #header-actions>
      <v-btn
        v-if="isSystemAdmin && fundingPeriodsCount > 0 && fundingPeriodId !== null"
        color="primary"
        :to="{
          name: 'administration/children-with-diverse-needs-funding-categories/ChildrenWithDiverseNeedsFundingCategoryNewPage',
          query: { fundingPeriodId },
        }"
      >
        <v-icon class="mr-2">mdi-plus</v-icon>
        New Diverse Need Category
      </v-btn>
    </template>
    <FundingPeriodSearchableAutocomplete
      v-model="fundingPeriodId"
      clearable
    />
    <ChildrenWithDiverseNeedsFundingCategoriesDataTableServer
      :where="childrenWithDiverseNeedsFundingCategoriesWhere"
    />
  </HeaderActionsCard>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"

import useBreadcrumbs from "@/use/use-breadcrumbs"
import useFundingPeriods from "@/use/use-funding-periods"
import useCurrentUser from "@/use/use-current-user"

import ChildrenWithDiverseNeedsFundingCategoriesDataTableServer from "@/components/children-with-diverse-needs-funding-categories/ChildrenWithDiverseNeedsFundingCategoriesDataTableServer.vue"
import FundingPeriodSearchableAutocomplete from "@/components/funding-periods/FundingPeriodSearchableAutocomplete.vue"
import HeaderActionsCard from "@/components/common/HeaderActionsCard.vue"

const fundingPeriodsQuery = ref({ perPage: 1 })
const { totalCount: fundingPeriodsCount } = useFundingPeriods(fundingPeriodsQuery)
const fundingPeriodId = ref<number | null>(null)
const { isSystemAdmin } = useCurrentUser()
const childrenWithDiverseNeedsFundingCategoriesWhere = computed(() => ({
  fundingPeriodId: fundingPeriodId.value ?? undefined,
}))

useBreadcrumbs("Diverse Need Categories", [
  {
    title: "Administration",
    to: { name: "AdministrationPage" },
  },
  {
    title: "Diverse Need Categories",
    to: { name: "administration/ChildrenWithDiverseNeedsFundingCategoriesPage" },
  },
])
</script>
