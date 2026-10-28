<template>
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
  <HeaderActionsCard
    v-else-if="administrationCostCategory"
    title="Administration Cost Category Details"
  >
    <template #header-actions>
      <v-btn
        v-if="policy?.update"
        color="primary"
        :to="{
          name: 'administration/administration-cost-categories/AdministrationCostCategoryEditPage',
          params: {
            administrationCostCategoryId,
          },
        }"
      >
        Edit
      </v-btn>
      <v-btn
        v-if="policy?.destroy"
        class="mt-2 mt-md-0 ml-md-2"
        color="error"
        :loading="isDeleting"
        @click="deleteCategory"
      >
        Delete
      </v-btn>
    </template>

    <v-row>
      <v-col
        cols="12"
        md="6"
      >
        <DescriptionElement
          label="Funding Period"
          :model-value="fundingPeriodDescription"
          vertical
        />
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <DescriptionElement
          label="Category Name"
          :model-value="administrationCostCategory.categoryName"
          vertical
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col
        cols="12"
        md="4"
      >
        <DescriptionElement
          label="From Age"
          :model-value="administrationCostCategory.fromAge ?? '—'"
          vertical
        />
      </v-col>
      <v-col
        cols="12"
        md="4"
      >
        <DescriptionElement
          label="To Age"
          :model-value="administrationCostCategory.toAge ?? '—'"
          vertical
        />
      </v-col>
      <v-col
        cols="12"
        md="4"
      >
        <DescriptionElement
          label="Monthly Amount"
          :model-value="
            formatMoney(administrationCostCategory.monthlyAmount, {
              maximumFractionDigits: 4,
            })
          "
          vertical
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <DescriptionElement
          label="Linked Child Care Space Category ID"
          :model-value="administrationCostCategory.childCareSpaceCategoryId ?? '—'"
          vertical
        />
      </v-col>
    </v-row>
  </HeaderActionsCard>
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

import DescriptionElement from "@/components/common/DescriptionElement.vue"
import HeaderActionsCard from "@/components/common/HeaderActionsCard.vue"

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
