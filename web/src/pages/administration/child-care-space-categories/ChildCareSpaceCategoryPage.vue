<template>
  <v-skeleton-loader
    v-if="isLoading"
    type="card"
  />
  <v-alert
    v-else-if="isErrored"
    type="error"
    variant="tonal"
  >
    Child Care Space category details could not be loaded.
  </v-alert>
  <HeaderActionsCard
    v-else-if="!isNil(childCareSpaceCategory)"
    title="Child Care Space Category Details"
  >
    <template #header-actions>
      <v-btn
        v-if="policy?.update"
        color="primary"
        :to="{
          name: 'administration/child-care-space-categories/ChildCareSpaceCategoryEditPage',
          params: {
            childCareSpaceCategoryId,
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
        @click="deleteChildCareSpaceCategory(childCareSpaceCategoryIdAsNumber)"
      >
        Delete
      </v-btn>
    </template>

    <v-alert
      v-if="isFundingPeriodErrored"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      The funding period could not be loaded.
    </v-alert>
    <v-row>
      <v-col
        cols="12"
        md="6"
      >
        <DescriptionElement
          label="Funding Period"
          :model-value="fundingPeriodDescription"
          :loading="isLoadingFundingPeriod"
          vertical
        />
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <DescriptionElement
          label="Category Name"
          :model-value="childCareSpaceCategory.categoryName"
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
          :model-value="childCareSpaceCategory.fromAge ?? '—'"
          vertical
        />
      </v-col>
      <v-col
        cols="12"
        md="4"
      >
        <DescriptionElement
          label="To Age"
          :model-value="childCareSpaceCategory.toAge ?? '—'"
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
            formatMoney(childCareSpaceCategory.monthlyAmount, monthlyAmountFormatOptions)
          "
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
          label="Created At"
          :model-value="formatDate(childCareSpaceCategory.createdAt)"
          vertical
        />
      </v-col>
      <v-col
        cols="12"
        md="8"
      >
        <DescriptionElement
          label="Updated At"
          :model-value="formatDate(childCareSpaceCategory.updatedAt)"
          vertical
        />
      </v-col>
    </v-row>
  </HeaderActionsCard>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { useRouter } from "vue-router"
import { isNil } from "lodash"

import blockedToTrueConfirm from "@/utils/blocked-to-true-confirm"
import { formatDate, formatMoney } from "@/utils/formatters"

import childCareSpaceCategoriesApi from "@/api/child-care-space-categories-api"
import useBreadcrumbs from "@/use/use-breadcrumbs"
import useChildCareSpaceCategory from "@/use/use-child-care-space-category"
import useFundingPeriod from "@/use/use-funding-period"
import useSnack from "@/use/use-snack"

import DescriptionElement from "@/components/common/DescriptionElement.vue"
import HeaderActionsCard from "@/components/common/HeaderActionsCard.vue"

const monthlyAmountFormatOptions = { minimumFractionDigits: 2, maximumFractionDigits: 4 }

const props = defineProps<{
  childCareSpaceCategoryId: string
}>()

const childCareSpaceCategoryIdAsNumber = computed(() => parseInt(props.childCareSpaceCategoryId))
const {
  childCareSpaceCategory,
  policy,
  isLoading: isLoadingCategory,
  isErrored: isCategoryErrored,
} = useChildCareSpaceCategory(childCareSpaceCategoryIdAsNumber)
const fundingPeriodId = computed(() => childCareSpaceCategory.value?.fundingPeriodId)
const {
  fundingPeriod,
  isLoading: isLoadingFundingPeriod,
  isErrored: isFundingPeriodErrored,
} = useFundingPeriod(fundingPeriodId)
const isLoading = computed(
  () =>
    isLoadingCategory.value ||
    (!isNil(childCareSpaceCategory.value) && isLoadingFundingPeriod.value)
)
const isErrored = computed(() => isCategoryErrored.value)
const fundingPeriodDescription = computed(() => {
  if (fundingPeriod.value === null) return "Unavailable"

  const { fiscalYear, title } = fundingPeriod.value
  return title ? `${fiscalYear} — ${title}` : fiscalYear
})

const isDeleting = ref(false)
const snack = useSnack()
const router = useRouter()

async function deleteChildCareSpaceCategory(childCareSpaceCategoryId: number) {
  if (!blockedToTrueConfirm("Are you sure you want to remove this Child Care Space category?")) {
    return
  }

  isDeleting.value = true
  try {
    await childCareSpaceCategoriesApi.delete(childCareSpaceCategoryId)
    snack.success("Child Care Space category deleted.")
    return router.push({
      name: "administration/ChildCareSpaceCategoriesPage",
    })
  } catch (error) {
    console.error(`Failed to delete Child Care Space category: ${error}`, { error })
    snack.error(`Failed to delete Child Care Space category: ${error}`)
  } finally {
    isDeleting.value = false
  }
}

const title = computed(
  () => childCareSpaceCategory.value?.categoryName || "Child Care Space Category"
)
const categoryTitle = computed(() => childCareSpaceCategory.value?.categoryName || "Details")
const breadcrumbs = computed(() => [
  {
    title: "Administration",
    to: {
      name: "AdministrationPage",
    },
  },
  {
    title: "Child Care Space Categories",
    to: {
      name: "administration/ChildCareSpaceCategoriesPage",
    },
  },
  {
    title: categoryTitle.value,
    to: {
      name: "administration/child-care-space-categories/ChildCareSpaceCategoryPage",
      params: {
        childCareSpaceCategoryId: props.childCareSpaceCategoryId,
      },
    },
  },
])

useBreadcrumbs(title, breadcrumbs)
</script>
