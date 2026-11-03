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
  <HeaderActionsCard
    v-else-if="childrenWithDiverseNeedsFundingCategory"
    title="Diverse Need Category Details"
  >
    <template #header-actions>
      <v-btn
        v-if="policy?.update"
        color="primary"
        :to="{
          name: 'administration/children-with-diverse-needs-funding-categories/ChildrenWithDiverseNeedsFundingCategoryEditPage',
          params: { childrenWithDiverseNeedsFundingCategoryId: categoryId },
        }"
      >
        Edit
      </v-btn>
      <v-btn
        v-if="policy?.destroy"
        color="error"
        :loading="isDeleting"
        :disabled="isDeleting"
        @click="retireCategory"
      >
        Retire
      </v-btn>
    </template>
    <v-alert
      v-if="isFundingPeriodErrored"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      The funding period could not be loaded.
      <v-btn
        variant="text"
        @click="refreshFundingPeriod"
        >Retry</v-btn
      >
    </v-alert>
    <v-row>
      <v-col
        cols="12"
        md="6"
      >
        <DescriptionElement
          :model-value="childrenWithDiverseNeedsFundingCategory.categoryName"
          label="Category Name"
          vertical
        />
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <DescriptionElement
          :model-value="fundingPeriodDescription"
          :loading="isLoadingFundingPeriod"
          label="Funding Period"
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
          :model-value="childrenWithDiverseNeedsFundingCategory.fromAge ?? '—'"
          label="From Age"
          vertical
        />
      </v-col>
      <v-col
        cols="12"
        md="4"
      >
        <DescriptionElement
          :model-value="childrenWithDiverseNeedsFundingCategory.toAge ?? '—'"
          label="To Age"
          vertical
        />
      </v-col>
      <v-col
        cols="12"
        md="4"
      >
        <DescriptionElement
          :model-value="
            formatMoney(childrenWithDiverseNeedsFundingCategory.monthlyAmount, {
              maximumFractionDigits: 4,
            })
          "
          label="Monthly Amount"
          vertical
        />
      </v-col>
    </v-row>
  </HeaderActionsCard>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { useRouter } from "vue-router"

import childrenWithDiverseNeedsFundingCategoriesApi from "@/api/children-with-diverse-needs-funding-categories-api"
import useChildrenWithDiverseNeedsFundingCategory from "@/use/use-children-with-diverse-needs-funding-category"
import useFundingPeriod from "@/use/use-funding-period"
import useBreadcrumbs from "@/use/use-breadcrumbs"
import useSnack from "@/use/use-snack"
import { formatMoney } from "@/utils/formatters"
import blockedToTrueConfirm from "@/utils/blocked-to-true-confirm"

import HeaderActionsCard from "@/components/common/HeaderActionsCard.vue"
import DescriptionElement from "@/components/common/DescriptionElement.vue"

const props = defineProps<{
  childrenWithDiverseNeedsFundingCategoryId: string
}>()
const router = useRouter()
const categoryId = computed(() => Number(props.childrenWithDiverseNeedsFundingCategoryId))
const {
  childrenWithDiverseNeedsFundingCategory,
  policy,
  isLoading,
  isErrored,
  fetch: refreshCategory,
} = useChildrenWithDiverseNeedsFundingCategory(categoryId)
const fundingPeriodId = computed(
  () => childrenWithDiverseNeedsFundingCategory.value?.fundingPeriodId
)
const {
  fundingPeriod,
  isLoading: isLoadingFundingPeriod,
  isErrored: isFundingPeriodErrored,
  refresh: refreshFundingPeriod,
} = useFundingPeriod(fundingPeriodId)
const fundingPeriodDescription = computed(() => fundingPeriod.value?.fiscalYear ?? "Unavailable")
const isDeleting = ref(false)
const snack = useSnack()

async function retireCategory() {
  if (
    !policy.value?.destroy ||
    isDeleting.value ||
    !blockedToTrueConfirm("Are you sure you want to retire this diverse need category?")
  )
    return

  isDeleting.value = true
  try {
    await childrenWithDiverseNeedsFundingCategoriesApi.delete(categoryId.value)
    snack.success("Diverse need category retired successfully!")
    await router.push({ name: "administration/ChildrenWithDiverseNeedsFundingCategoriesPage" })
  } catch (error) {
    snack.error(`Failed to retire diverse need category: ${error}`)
  } finally {
    isDeleting.value = false
  }
}

useBreadcrumbs("Diverse Need Category Details", [
  { title: "Administration", to: { name: "AdministrationPage" } },
  {
    title: "Diverse Need Categories",
    to: { name: "administration/ChildrenWithDiverseNeedsFundingCategoriesPage" },
  },
  {
    title: "Details",
    to: {
      name: "administration/children-with-diverse-needs-funding-categories/ChildrenWithDiverseNeedsFundingCategoryPage",
      params: { childrenWithDiverseNeedsFundingCategoryId: categoryId.value },
    },
  },
])
</script>
