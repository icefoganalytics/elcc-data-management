<template>
  <HeaderActionsFormCard
    ref="form"
    title="New Administration Cost Category"
    @submit.prevent="createCategory"
  >
    <v-alert
      v-if="isFundingPeriodsErrored"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      Funding periods could not be loaded. Reload the page to try again.
    </v-alert>
    <v-alert
      v-else-if="!isLoadingFundingPeriods && fundingPeriods.length === 0"
      type="warning"
      variant="tonal"
      class="mb-4"
    >
      Create a funding period before adding an Administration cost category.
    </v-alert>
    <v-select
      v-model="fundingPeriodId"
      :items="fundingPeriods"
      item-title="fiscalYear"
      item-value="id"
      label="Funding Period *"
      :loading="isLoadingFundingPeriods"
      :rules="[required]"
    />
    <v-text-field
      v-model="categoryName"
      label="Category Name *"
      :rules="[required]"
    />
    <v-row>
      <v-col
        cols="12"
        md="6"
      >
        <v-text-field
          v-model="fromAge"
          label="From Age"
          type="number"
          min="0"
          step="1"
        />
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <v-text-field
          v-model="toAge"
          label="To Age"
          type="number"
          min="0"
          step="1"
        />
      </v-col>
    </v-row>
    <CurrencyInput
      v-model="monthlyAmount"
      label="Monthly Amount *"
      :options="monthlyAmountOptions"
      :rules="[required]"
    />
    <v-alert
      v-if="isSpaceCategoriesErrored"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      Linked Child Care Space categories could not be loaded. Reload the page to try again.
    </v-alert>
    <v-select
      v-model="childCareSpaceCategoryId"
      :items="childCareSpaceCategories"
      item-title="categoryName"
      item-value="id"
      label="Linked Child Care Space Category"
      :loading="isLoadingSpaceCategories"
      :disabled="isNil(fundingPeriodId) || isLoadingSpaceCategories || isSpaceCategoriesErrored"
      clearable
    />
    <template #actions>
      <v-btn
        type="submit"
        color="primary"
        :loading="isSaving"
        :disabled="isLoadingFundingPeriods || isFundingPeriodsErrored"
      >
        Create Administration Cost Category
      </v-btn>
      <v-spacer />
      <v-btn
        color="warning"
        variant="outlined"
        :to="{ name: 'administration/AdministrationCostCategoriesPage' }"
      >
        Cancel
      </v-btn>
    </template>
  </HeaderActionsFormCard>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useRouter } from "vue-router"
import { isNil } from "lodash"

import administrationCostCategoriesApi from "@/api/administration-cost-categories-api"
import { required } from "@/utils/validators"
import useBreadcrumbs from "@/use/use-breadcrumbs"
import useChildCareSpaceCategories from "@/use/use-child-care-space-categories"
import useFundingPeriods from "@/use/use-funding-periods"
import useSnack from "@/use/use-snack"

import CurrencyInput from "@/components/CurrencyInput.vue"
import HeaderActionsFormCard from "@/components/common/HeaderActionsFormCard.vue"

const monthlyAmountOptions = { precision: 4 }
const router = useRouter()
const snack = useSnack()
const form = ref<InstanceType<typeof HeaderActionsFormCard> | null>(null)
const fundingPeriodId = ref<number | null>(null)
const categoryName = ref("")
const fromAge = ref<string | number | null>(null)
const toAge = ref<string | number | null>(null)
const monthlyAmount = ref<string | null>(null)
const childCareSpaceCategoryId = ref<number | null>(null)
const isSaving = ref(false)

const {
  fundingPeriods,
  isLoading: isLoadingFundingPeriods,
  isErrored: isFundingPeriodsErrored,
} = useFundingPeriods(ref({ perPage: -1 }))
const spaceCategoriesQuery = computed(() => ({
  where: { fundingPeriodId: fundingPeriodId.value ?? undefined },
  perPage: -1,
}))
const {
  childCareSpaceCategories,
  isLoading: isLoadingSpaceCategories,
  isErrored: isSpaceCategoriesErrored,
} = useChildCareSpaceCategories(spaceCategoriesQuery, {
  skipWatchIf: () => isNil(fundingPeriodId.value),
})

watch(fundingPeriodId, () => {
  childCareSpaceCategoryId.value = null
})

async function createCategory() {
  if (isNil(form.value) || isSaving.value) return

  const { valid } = await form.value.validate()
  if (!valid || isNil(fundingPeriodId.value) || isNil(monthlyAmount.value)) return

  isSaving.value = true
  try {
    const { administrationCostCategory } = await administrationCostCategoriesApi.create({
      fundingPeriodId: fundingPeriodId.value,
      childCareSpaceCategoryId: childCareSpaceCategoryId.value,
      categoryName: categoryName.value,
      fromAge: isNil(fromAge.value) || fromAge.value === "" ? null : Number(fromAge.value),
      toAge: isNil(toAge.value) || toAge.value === "" ? null : Number(toAge.value),
      monthlyAmount: monthlyAmount.value,
    })
    snack.success("Administration cost category created successfully!")
    await router.push({
      name: "administration/administration-cost-categories/AdministrationCostCategoryPage",
      params: { administrationCostCategoryId: administrationCostCategory.id },
    })
  } catch (error) {
    snack.error(`Failed to create Administration cost category: ${error}`)
  } finally {
    isSaving.value = false
  }
}

useBreadcrumbs("New Administration Cost Category", [
  { title: "Administration", to: { name: "AdministrationPage" } },
  {
    title: "Administration Cost Categories",
    to: { name: "administration/AdministrationCostCategoriesPage" },
  },
  {
    title: "New Administration Cost Category",
    to: { name: "administration/administration-cost-categories/AdministrationCostCategoryNewPage" },
  },
])
</script>
