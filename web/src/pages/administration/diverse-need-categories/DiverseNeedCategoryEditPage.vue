<template>
  <v-skeleton-loader
    v-if="isLoading"
    type="card"
  />
  <v-empty-state
    v-else-if="isErrored"
    class="ma-5"
    icon="mdi-alert-circle-outline"
    headline="Unable to Load Category"
    title="Diverse need category could not be loaded."
  >
    <template #actions>
      <v-btn
        color="primary"
        @click="refreshCategory"
        >Retry</v-btn
      >
    </template>
  </v-empty-state>
  <DiverseNeedCategoryEditForm
    v-else-if="diverseNeedCategory && policy?.update"
    v-model:diverse-need-category="diverseNeedCategory"
    :funding-period-description="fundingPeriodDescription"
    :is-saving="isSaving"
    @save="saveCategory"
    @cancel="cancelEditing"
  />
  <v-empty-state
    v-else-if="diverseNeedCategory"
    class="ma-5"
    icon="mdi-lock-outline"
    headline="Editing Not Allowed"
    title="You do not have permission to edit this category."
  />
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { useRouter } from "vue-router"

import useDiverseNeedCategory from "@/use/use-diverse-need-category"
import useFundingPeriods from "@/use/use-funding-periods"
import useBreadcrumbs from "@/use/use-breadcrumbs"
import useSnack from "@/use/use-snack"

import DiverseNeedCategoryEditForm from "@/components/diverse-need-categories/DiverseNeedCategoryEditForm.vue"

const props = defineProps<{
  diverseNeedCategoryId: string
}>()
const router = useRouter()
const isSaving = ref(false)
const snack = useSnack()
const categoryId = computed(() => Number(props.diverseNeedCategoryId))
const {
  diverseNeedCategory,
  policy,
  isLoading,
  isErrored,
  fetch: refreshCategory,
  save,
} = useDiverseNeedCategory(categoryId)
const fundingPeriodsQuery = ref({ perPage: -1 })
const { fundingPeriods } = useFundingPeriods(fundingPeriodsQuery)
const fundingPeriodDescription = computed(() => {
  const fundingPeriod = fundingPeriods.value.find(
    ({ id }) => id === diverseNeedCategory.value?.fundingPeriodId
  )
  return fundingPeriod?.fiscalYear ?? "Unknown"
})

async function saveCategory() {
  if (!policy.value?.update || isSaving.value) return

  isSaving.value = true
  try {
    await save()
    snack.success("Diverse need category updated successfully!")
  } catch (error) {
    snack.error(`Failed to update diverse need category: ${error}`)
  } finally {
    isSaving.value = false
  }
}

async function cancelEditing() {
  await router.push({
    name: "administration/diverse-need-categories/DiverseNeedCategoryPage",
    params: { diverseNeedCategoryId: categoryId.value },
  })
}

useBreadcrumbs("Edit Diverse Need Category", [
  { title: "Administration", to: { name: "AdministrationPage" } },
  { title: "Diverse Need Categories", to: { name: "administration/DiverseNeedCategoriesPage" } },
  {
    title: "Edit Category",
    to: {
      name: "administration/diverse-need-categories/DiverseNeedCategoryEditPage",
      params: { diverseNeedCategoryId: categoryId.value },
    },
  },
])
</script>
