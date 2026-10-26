<template>
  <v-container>
    <v-skeleton-loader
      v-if="isLoading && !administrationCostCategory"
      type="card"
    />
    <v-alert
      v-else-if="isErrored && !administrationCostCategory"
      type="error"
      variant="tonal"
    >
      Administration category could not be loaded.
      <v-btn
        variant="outlined"
        @click="fetch"
        >Retry</v-btn
      >
    </v-alert>
    <v-card
      v-else-if="administrationCostCategory"
      title="Administration Cost Category Details"
    >
      <template #append>
        <v-btn
          v-if="policy?.update"
          color="primary"
          :to="{
            name: 'administration/administration-cost-categories/AdministrationCostCategoryEditPage',
            params: {
              administrationCostCategoryId,
            },
          }"
          >Edit</v-btn
        >
        <v-btn
          v-if="policy?.destroy"
          class="ml-2"
          color="error"
          :loading="isDeleting"
          @click="deleteCategory"
          >Delete</v-btn
        >
      </template>
      <v-card-text>
        <v-list>
          <v-list-item
            title="Funding Period"
            :subtitle="fundingPeriodDescription"
          />
          <v-list-item
            title="Category Name"
            :subtitle="administrationCostCategory.categoryName"
          />
          <v-list-item
            title="From Age"
            :subtitle="administrationCostCategory.fromAge ?? '—'"
          />
          <v-list-item
            title="To Age"
            :subtitle="administrationCostCategory.toAge ?? '—'"
          />
          <v-list-item
            title="Monthly Amount"
            :subtitle="formatMoney(administrationCostCategory.monthlyAmount, amountFormatOptions)"
          />
          <v-list-item
            title="Linked Child Care Space Category ID"
            :subtitle="administrationCostCategory.childCareSpaceCategoryId ?? '—'"
          />
        </v-list>
      </v-card-text>
    </v-card>
  </v-container>
</template>
<script setup lang="ts">
import { computed, ref } from "vue"
import { useRouter } from "vue-router"

import { formatMoney } from "@/utils/formatters"
import useAdministrationCostCategory from "@/use/use-administration-cost-category"
import useSnack from "@/use/use-snack"
import useBreadcrumbs from "@/use/use-breadcrumbs"
import useFundingPeriods from "@/use/use-funding-periods"
import { blockedToTrueConfirm } from "@/utils/blocked-to-true-confirm"

const amountFormatOptions = {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
}
const props = defineProps<{ administrationCostCategoryId: string }>()
const administrationCostCategoryId = computed(() => Number(props.administrationCostCategoryId))
const { administrationCostCategory, policy, isLoading, isErrored, fetch, remove } =
  useAdministrationCostCategory(administrationCostCategoryId)
const { fundingPeriods } = useFundingPeriods(
  ref({
    perPage: -1,
  })
)
const fundingPeriodDescription = computed(() => {
  const fundingPeriod = fundingPeriods.value.find(
    ({ id }) => id === administrationCostCategory.value?.fundingPeriodId
  )
  return fundingPeriod?.fiscalYear ?? String(administrationCostCategory.value?.fundingPeriodId)
})
const router = useRouter()
const snack = useSnack()
const isDeleting = ref(false)

async function deleteCategory() {
  if (!blockedToTrueConfirm("Are you sure you want to remove this Administration cost category?"))
    return
  isDeleting.value = true
  try {
    await remove()
    snack.success("Administration cost category deleted.")
    await router.push({
      name: "administration/AdministrationCostCategoriesPage",
    })
  } catch (error) {
    snack.error(`Failed to delete Administration cost category: ${error}`)
  } finally {
    isDeleting.value = false
  }
}

useBreadcrumbs("Administration Cost Category", [
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
  {
    title: "Administration Cost Category",
    to: {
      name: "administration/administration-cost-categories/AdministrationCostCategoryPage",
      params: {
        administrationCostCategoryId: administrationCostCategoryId.value,
      },
    },
  },
])
</script>
