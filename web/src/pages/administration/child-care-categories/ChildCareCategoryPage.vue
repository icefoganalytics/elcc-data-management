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
    Child Care category details could not be loaded.
  </v-alert>
  <HeaderActionsCard
    v-else-if="!isNil(childCareCategory)"
    title="Child Care Category Details"
  >
    <template #header-actions>
      <v-btn
        v-if="policy?.update"
        color="primary"
        :to="{
          name: 'administration/child-care-categories/ChildCareCategoryEditPage',
          params: {
            childCareCategoryId,
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
        @click="deleteChildCareCategory(childCareCategoryIdAsNumber)"
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
          :model-value="childCareCategory.categoryName"
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
          :model-value="childCareCategory.fromAge ?? '—'"
          vertical
        />
      </v-col>
      <v-col
        cols="12"
        md="4"
      >
        <DescriptionElement
          label="To Age"
          :model-value="childCareCategory.toAge ?? '—'"
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
          :model-value="formatDate(childCareCategory.createdAt)"
          vertical
        />
      </v-col>
      <v-col
        cols="12"
        md="8"
      >
        <DescriptionElement
          label="Updated At"
          :model-value="formatDate(childCareCategory.updatedAt)"
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
import { formatDate } from "@/utils/formatters"

import childCareCategoriesApi from "@/api/child-care-categories-api"
import ApiOperationError from "@/api/errors/api-operation-error"

import useBreadcrumbs from "@/use/use-breadcrumbs"
import useChildCareCategory from "@/use/use-child-care-category"
import useFundingPeriod from "@/use/use-funding-period"
import useSnack from "@/use/use-snack"

import DescriptionElement from "@/components/common/DescriptionElement.vue"
import HeaderActionsCard from "@/components/common/HeaderActionsCard.vue"

const props = defineProps<{
  childCareCategoryId: string
}>()

const childCareCategoryIdAsNumber = computed(() => parseInt(props.childCareCategoryId))
const {
  childCareCategory,
  policy,
  isLoading: isLoadingCategory,
  isErrored: isCategoryErrored,
} = useChildCareCategory(childCareCategoryIdAsNumber)
const fundingPeriodId = computed(() => childCareCategory.value?.fundingPeriodId)
const {
  fundingPeriod,
  isLoading: isLoadingFundingPeriod,
  isErrored: isFundingPeriodErrored,
} = useFundingPeriod(fundingPeriodId)
const isLoading = computed(
  () => isLoadingCategory.value || (!isNil(childCareCategory.value) && isLoadingFundingPeriod.value)
)
const isErrored = computed(() => isCategoryErrored.value)
const fundingPeriodDescription = computed(() => {
  if (fundingPeriod.value === null) {
    return "Unavailable"
  }

  const { fiscalYear, title } = fundingPeriod.value
  return title ? `${fiscalYear} — ${title}` : fiscalYear
})

const isDeleting = ref(false)
const snack = useSnack()
const router = useRouter()

async function deleteChildCareCategory(childCareCategoryId: number) {
  if (!blockedToTrueConfirm("Are you sure you want to remove this Child Care category?")) {
    return
  }

  isDeleting.value = true
  try {
    await childCareCategoriesApi.delete(childCareCategoryId)
    snack.success("Child Care category deleted.")
    return router.push({
      name: "administration/ChildCareCategoriesPage",
    })
  } catch (error) {
    if (error instanceof ApiOperationError) {
      console.error(`Failed to delete Child Care category: ${error}`, { error })
      snack.error(`Failed to delete Child Care category: ${error}`)
      return
    }

    throw error
  } finally {
    isDeleting.value = false
  }
}

const title = computed(() => childCareCategory.value?.categoryName || "Child Care Category")
const categoryTitle = computed(() => childCareCategory.value?.categoryName || "Details")
const breadcrumbs = computed(() => [
  {
    title: "Administration",
    to: {
      name: "AdministrationPage",
    },
  },
  {
    title: "Child Care Categories",
    to: {
      name: "administration/ChildCareCategoriesPage",
    },
  },
  {
    title: categoryTitle.value,
    to: {
      name: "administration/child-care-categories/ChildCareCategoryPage",
      params: {
        childCareCategoryId: props.childCareCategoryId,
      },
    },
  },
])

useBreadcrumbs(title, breadcrumbs)
</script>
