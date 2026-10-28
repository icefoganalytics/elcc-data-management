<template>
  <v-skeleton-loader
    v-if="isLoading && isNil(administrationCostCategory)"
    type="card"
  />
  <v-alert
    v-else-if="isErrored && isNil(administrationCostCategory)"
    type="error"
    variant="tonal"
  >
    Administration cost category could not be loaded.
    <v-btn
      variant="outlined"
      @click="fetch"
      >Retry</v-btn
    >
  </v-alert>
  <v-alert
    v-else-if="administrationCostCategory && !policy?.update"
    type="warning"
    variant="tonal"
  >
    You do not have permission to edit this Administration cost category.
  </v-alert>
  <HeaderActionsFormCard
    v-else-if="administrationCostCategory"
    ref="form"
    title="Edit Administration Cost Category"
    @submit.prevent="saveCategory"
  >
    <v-text-field
      :model-value="fundingPeriodDescription"
      label="Funding Period"
      readonly
    />
    <v-text-field
      v-model="administrationCostCategory.categoryName"
      label="Category Name *"
      :rules="[required]"
    />
    <v-row>
      <v-col
        cols="12"
        md="6"
      >
        <v-text-field
          v-model.number="administrationCostCategory.fromAge"
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
          v-model.number="administrationCostCategory.toAge"
          label="To Age"
          type="number"
          min="0"
          step="1"
        />
      </v-col>
    </v-row>
    <CurrencyInput
      v-model="administrationCostCategory.monthlyAmount"
      label="Monthly Amount *"
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
      v-model="administrationCostCategory.childCareSpaceCategoryId"
      :items="availableChildCareSpaceCategories"
      item-title="categoryName"
      item-value="id"
      label="Linked Child Care Space Category"
      :loading="isLoadingSpaceCategories"
      :disabled="isSpaceCategoriesErrored"
      clearable
    />
    <template #actions>
      <v-btn
        type="submit"
        color="primary"
        :loading="isSaving"
        >Save Changes</v-btn
      >
      <v-spacer />
      <v-btn
        color="warning"
        variant="outlined"
        :to="{
          name: 'administration/administration-cost-categories/AdministrationCostCategoryPage',
          params: {
            administrationCostCategoryId,
          },
        }"
      >
        Cancel
      </v-btn>
    </template>
  </HeaderActionsFormCard>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { isNil } from "lodash"

import { required } from "@/utils/validators"
import useAdministrationCostCategory from "@/use/use-administration-cost-category"
import useBreadcrumbs from "@/use/use-breadcrumbs"
import useChildCareSpaceCategories from "@/use/use-child-care-space-categories"
import useFundingPeriods from "@/use/use-funding-periods"
import useSnack from "@/use/use-snack"

import CurrencyInput from "@/components/CurrencyInput.vue"
import HeaderActionsFormCard from "@/components/common/HeaderActionsFormCard.vue"

const props = defineProps<{
  administrationCostCategoryId: string
}>()

const administrationCostCategoryId = computed(() => Number(props.administrationCostCategoryId))
const { administrationCostCategory, policy, isLoading, isErrored, fetch, save } =
  useAdministrationCostCategory(administrationCostCategoryId)

const fundingPeriodId = computed(() => administrationCostCategory.value?.fundingPeriodId)
const { fundingPeriods } = useFundingPeriods(
  ref({
    perPage: -1,
  })
)

const fundingPeriodDescription = computed(() => {
  const fundingPeriod = fundingPeriods.value.find(({ id }) => id === fundingPeriodId.value)
  return fundingPeriod?.fiscalYear ?? String(fundingPeriodId.value)
})

const spaceCategoriesQuery = computed(() => ({
  where: {
    fundingPeriodId: fundingPeriodId.value,
  },
  perPage: -1,
}))
const {
  childCareSpaceCategories,
  isLoading: isLoadingSpaceCategories,
  isErrored: isSpaceCategoriesErrored,
} = useChildCareSpaceCategories(spaceCategoriesQuery, {
  skipWatchIf: () => isNil(fundingPeriodId.value),
})

const availableChildCareSpaceCategories = computed(() =>
  childCareSpaceCategories.value.filter(
    (category) => category.fundingPeriodId === fundingPeriodId.value
  )
)

const form = ref<InstanceType<typeof HeaderActionsFormCard> | null>(null)
const isSaving = ref(false)

const snack = useSnack()

async function saveCategory() {
  if (isNil(form.value) || isSaving.value) return

  const { valid } = await form.value.validate()
  if (!valid || isNil(administrationCostCategory.value)) return

  const { categoryName, fromAge, toAge, monthlyAmount, childCareSpaceCategoryId } =
    administrationCostCategory.value
  if (isNil(monthlyAmount)) return

  isSaving.value = true
  try {
    await save({
      categoryName,
      fromAge: isNil(fromAge) || String(fromAge) === "" ? null : Number(fromAge),
      toAge: isNil(toAge) || String(toAge) === "" ? null : Number(toAge),
      monthlyAmount,
      childCareSpaceCategoryId,
    })
    snack.success("Administration cost category updated successfully!")
  } catch (error) {
    snack.error(`Failed to update Administration cost category: ${error}`)
  } finally {
    isSaving.value = false
  }
}

useBreadcrumbs("Edit Administration Cost Category", [
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
    title: "Edit Administration Cost Category",
    to: {
      name: "administration/administration-cost-categories/AdministrationCostCategoryEditPage",
      params: {
        administrationCostCategoryId: administrationCostCategoryId.value,
      },
    },
  },
])
</script>
