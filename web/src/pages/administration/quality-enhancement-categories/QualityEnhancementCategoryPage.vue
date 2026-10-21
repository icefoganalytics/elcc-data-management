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
    Quality Enhancement category details could not be loaded.
  </v-alert>
  <HeaderActionsCard
    v-else-if="!isNil(qualityEnhancementCategory)"
    title="Quality Enhancement Category Details"
  >
    <template #header-actions>
      <v-btn
        v-if="policy?.update"
        color="primary"
        :to="{
          name: 'administration/quality-enhancement-categories/QualityEnhancementCategoryEditPage',
          params: {
            qualityEnhancementCategoryId,
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
        @click="deleteQualityEnhancementCategory(qualityEnhancementCategoryIdAsNumber)"
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
          :model-value="qualityEnhancementCategory.categoryName"
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
          :model-value="qualityEnhancementCategory.fromAge ?? '—'"
          vertical
        />
      </v-col>
      <v-col
        cols="12"
        md="4"
      >
        <DescriptionElement
          label="To Age"
          :model-value="qualityEnhancementCategory.toAge ?? '—'"
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
            formatMoney(qualityEnhancementCategory.monthlyAmount, monthlyAmountFormatOptions)
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
          :model-value="formatDate(qualityEnhancementCategory.createdAt)"
          vertical
        />
      </v-col>
      <v-col
        cols="12"
        md="8"
      >
        <DescriptionElement
          label="Updated At"
          :model-value="formatDate(qualityEnhancementCategory.updatedAt)"
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

import qualityEnhancementCategoriesApi from "@/api/quality-enhancement-categories-api"
import useBreadcrumbs from "@/use/use-breadcrumbs"
import useQualityEnhancementCategory from "@/use/use-quality-enhancement-category"
import useFundingPeriod from "@/use/use-funding-period"
import useSnack from "@/use/use-snack"

import DescriptionElement from "@/components/common/DescriptionElement.vue"
import HeaderActionsCard from "@/components/common/HeaderActionsCard.vue"

const monthlyAmountFormatOptions = { minimumFractionDigits: 2, maximumFractionDigits: 4 }

const props = defineProps<{
  qualityEnhancementCategoryId: string
}>()

const qualityEnhancementCategoryIdAsNumber = computed(() =>
  parseInt(props.qualityEnhancementCategoryId)
)
const {
  qualityEnhancementCategory,
  policy,
  isLoading: isLoadingCategory,
  isErrored: isCategoryErrored,
} = useQualityEnhancementCategory(qualityEnhancementCategoryIdAsNumber)
const fundingPeriodId = computed(() => qualityEnhancementCategory.value?.fundingPeriodId)
const {
  fundingPeriod,
  isLoading: isLoadingFundingPeriod,
  isErrored: isFundingPeriodErrored,
} = useFundingPeriod(fundingPeriodId)
const isLoading = computed(
  () =>
    isLoadingCategory.value ||
    (!isNil(qualityEnhancementCategory.value) && isLoadingFundingPeriod.value)
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

async function deleteQualityEnhancementCategory(qualityEnhancementCategoryId: number) {
  if (!blockedToTrueConfirm("Are you sure you want to remove this Quality Enhancement category?")) {
    return
  }

  isDeleting.value = true
  try {
    await qualityEnhancementCategoriesApi.delete(qualityEnhancementCategoryId)
    snack.success("Quality Enhancement category deleted.")
    return router.push({
      name: "administration/QualityEnhancementCategoriesPage",
    })
  } catch (error) {
    console.error(`Failed to delete Quality Enhancement category: ${error}`, { error })
    snack.error(`Failed to delete Quality Enhancement category: ${error}`)
  } finally {
    isDeleting.value = false
  }
}

const title = computed(
  () => qualityEnhancementCategory.value?.categoryName || "Quality Enhancement Category"
)
const categoryTitle = computed(() => qualityEnhancementCategory.value?.categoryName || "Details")
const breadcrumbs = computed(() => [
  {
    title: "Administration",
    to: {
      name: "AdministrationPage",
    },
  },
  {
    title: "Quality Enhancement Categories",
    to: {
      name: "administration/QualityEnhancementCategoriesPage",
    },
  },
  {
    title: categoryTitle.value,
    to: {
      name: "administration/quality-enhancement-categories/QualityEnhancementCategoryPage",
      params: {
        qualityEnhancementCategoryId: props.qualityEnhancementCategoryId,
      },
    },
  },
])

useBreadcrumbs(title, breadcrumbs)
</script>
