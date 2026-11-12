<template>
  <v-skeleton-loader
    v-if="isLoading"
    type="card"
  />
  <template v-else-if="childrenWithDiverseNeedsFundingCategory">
    <v-row>
      <v-col cols="12">
        <v-text-field
          :model-value="fundingPeriodDescription"
          append-inner-icon="mdi-lock"
          label="Funding Period"
          readonly
        />
      </v-col>
    </v-row>
    <ChildrenWithDiverseNeedsFundingCategoryEditForm
      :children-with-diverse-needs-funding-category-id="categoryId"
      @cancel="cancelEditing"
    />
  </template>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { useRouter } from "vue-router"

import useChildrenWithDiverseNeedsFundingCategory from "@/use/use-children-with-diverse-needs-funding-category"
import useFundingPeriods from "@/use/use-funding-periods"
import useBreadcrumbs from "@/use/use-breadcrumbs"

import ChildrenWithDiverseNeedsFundingCategoryEditForm from "@/components/children-with-diverse-needs-funding-categories/ChildrenWithDiverseNeedsFundingCategoryEditForm.vue"

const props = defineProps<{
  childrenWithDiverseNeedsFundingCategoryId: string
}>()
const router = useRouter()
const categoryId = computed(() => Number(props.childrenWithDiverseNeedsFundingCategoryId))
const { childrenWithDiverseNeedsFundingCategory, isLoading } =
  useChildrenWithDiverseNeedsFundingCategory(categoryId)
const fundingPeriodsQuery = ref({ perPage: -1 })
const { fundingPeriods } = useFundingPeriods(fundingPeriodsQuery)
const fundingPeriodDescription = computed(() => {
  const fundingPeriod = fundingPeriods.value.find(
    ({ id }) => id === childrenWithDiverseNeedsFundingCategory.value?.fundingPeriodId
  )
  return fundingPeriod?.fiscalYear ?? "Unknown"
})

async function cancelEditing() {
  await router.push({
    name: "administration/children-with-diverse-needs-funding-categories/ChildrenWithDiverseNeedsFundingCategoryPage",
    params: { childrenWithDiverseNeedsFundingCategoryId: categoryId.value },
  })
}

useBreadcrumbs("Edit Diverse Need Category", [
  { title: "Administration", to: { name: "AdministrationPage" } },
  {
    title: "Diverse Need Categories",
    to: { name: "administration/ChildrenWithDiverseNeedsFundingCategoriesPage" },
  },
  {
    title: "Edit Category",
    to: {
      name: "administration/children-with-diverse-needs-funding-categories/ChildrenWithDiverseNeedsFundingCategoryEditPage",
      params: { childrenWithDiverseNeedsFundingCategoryId: categoryId.value },
    },
  },
])
</script>
