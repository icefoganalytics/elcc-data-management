<template>
  <v-skeleton-loader
    v-if="isLoading"
    type="card"
  />
  <ChildrenWithDiverseNeedsFundingCategoryEditForm
    v-else-if="childrenWithDiverseNeedsFundingCategory && policy?.update"
    v-model:children-with-diverse-needs-funding-category="childrenWithDiverseNeedsFundingCategory"
    :funding-period-description="fundingPeriodDescription"
    @saved="policy = $event"
    @cancel="cancelEditing"
  />
  <v-empty-state
    v-else-if="childrenWithDiverseNeedsFundingCategory"
    class="ma-5"
    icon="mdi-lock-outline"
    headline="Editing Not Allowed"
    title="You do not have permission to edit this category."
  />
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
const {
  childrenWithDiverseNeedsFundingCategory,
  policy,
  isLoading,
} = useChildrenWithDiverseNeedsFundingCategory(categoryId)
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
