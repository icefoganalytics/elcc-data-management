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
    title="Administration category could not be loaded."
  >
    <template #actions>
      <v-btn
        color="primary"
        @click="refreshCategory"
      >
        Retry
      </v-btn>
    </template>
  </v-empty-state>
  <HeaderActionsFormCard
    v-else-if="!isNil(administrationCostCategory)"
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
        <NumberTextField
          v-model="administrationCostCategory.fromAge"
          label="From Age"
          min="0"
          step="1"
        />
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <NumberTextField
          v-model="administrationCostCategory.toAge"
          label="To Age"
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
    <ChildCareSpaceCategorySearchableAutocomplete
      v-model="administrationCostCategory.childCareSpaceCategoryId"
      :where="childCareSpaceCategoriesWhere"
      label="Linked Child Care Space Category"
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
import { computed, ref, useTemplateRef } from "vue"
import { isNil } from "lodash"

import { required } from "@/utils/validators"

import useAdministrationCostCategory from "@/use/use-administration-cost-category"
import useBreadcrumbs from "@/use/use-breadcrumbs"
import useFundingPeriods from "@/use/use-funding-periods"
import useSnack from "@/use/use-snack"

import CurrencyInput from "@/components/CurrencyInput.vue"
import HeaderActionsFormCard from "@/components/common/HeaderActionsFormCard.vue"
import NumberTextField from "@/components/common/NumberTextField.vue"
import ChildCareSpaceCategorySearchableAutocomplete from "@/components/child-care-space-categories/ChildCareSpaceCategorySearchableAutocomplete.vue"

const props = defineProps<{
  administrationCostCategoryId: string
}>()

const administrationCostCategoryId = computed(() => Number(props.administrationCostCategoryId))
const {
  administrationCostCategory,
  isLoading,
  isErrored,
  fetch: refreshCategory,
  save,
} = useAdministrationCostCategory(administrationCostCategoryId)

const fundingPeriodId = computed(() => administrationCostCategory.value?.fundingPeriodId)
const fundingPeriodsQuery = ref({
  perPage: -1,
})
const { fundingPeriods } = useFundingPeriods(fundingPeriodsQuery)

const fundingPeriodDescription = computed(() => {
  const fundingPeriod = fundingPeriods.value.find(({ id }) => id === fundingPeriodId.value)
  return fundingPeriod?.fiscalYear ?? "Unknown"
})

const childCareSpaceCategoriesWhere = computed(() => ({
  fundingPeriodId: fundingPeriodId.value,
}))

const form = useTemplateRef("form")
const isSaving = ref(false)

const snack = useSnack()

async function saveCategory() {
  if (isNil(form.value) || isSaving.value) return

  const { valid } = await form.value.validate()
  if (!valid || isNil(administrationCostCategory.value)) return

  isSaving.value = true
  try {
    await save()
    snack.success("Administration cost category updated successfully!")
  } catch (error) {
    snack.error(`Failed to update Administration cost category: ${error}`, { cause: error })
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
