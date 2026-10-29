<template>
  <HeaderActionsFormCard
    ref="headerActionsFormCard"
    title="New Administration Cost Category"
    @submit.prevent="createCategory"
  >
    <FundingPeriodSearchableAutocomplete
      v-model="administrationCostCategoryAttributes.fundingPeriodId"
      label="Funding Period *"
      :select-first-on-load="false"
      :rules="[required]"
    />
    <v-text-field
      v-model="administrationCostCategoryAttributes.categoryName"
      label="Category Name *"
      :rules="[required]"
    />
    <v-row>
      <v-col
        cols="12"
        md="6"
      >
        <NumberTextField
          v-model="administrationCostCategoryAttributes.fromAge"
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
          v-model="administrationCostCategoryAttributes.toAge"
          label="To Age"
          min="0"
          step="1"
        />
      </v-col>
    </v-row>
    <CurrencyInput
      v-model="administrationCostCategoryAttributes.monthlyAmount"
      label="Monthly Amount *"
      :rules="[required]"
    />
    <ChildCareSpaceCategorySearchableAutocomplete
      v-model="administrationCostCategoryAttributes.childCareSpaceCategoryId"
      :where="childCareSpaceCategoriesWhere"
      label="Linked Child Care Space Category"
      :disabled="isNil(administrationCostCategoryAttributes.fundingPeriodId)"
      clearable
    />
    <template #actions>
      <v-btn
        type="submit"
        color="primary"
        :loading="isSaving"
      >
        Create Administration Cost Category
      </v-btn>
      <v-spacer />
      <v-btn
        color="warning"
        variant="outlined"
        :to="{
          name: 'administration/AdministrationCostCategoriesPage',
        }"
      >
        Cancel
      </v-btn>
    </template>
  </HeaderActionsFormCard>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from "vue"
import { useRouter } from "vue-router"
import { isNil } from "lodash"

import { required } from "@/utils/validators"

import administrationCostCategoriesApi, {
  type AdministrationCostCategory,
} from "@/api/administration-cost-categories-api"

import useBreadcrumbs from "@/use/use-breadcrumbs"
import useSnack from "@/use/use-snack"

import CurrencyInput from "@/components/CurrencyInput.vue"
import HeaderActionsFormCard from "@/components/common/HeaderActionsFormCard.vue"
import NumberTextField from "@/components/common/NumberTextField.vue"
import ChildCareSpaceCategorySearchableAutocomplete from "@/components/child-care-space-categories/ChildCareSpaceCategorySearchableAutocomplete.vue"
import FundingPeriodSearchableAutocomplete from "@/components/funding-periods/FundingPeriodSearchableAutocomplete.vue"

const administrationCostCategoryAttributes = ref<Partial<AdministrationCostCategory>>({
  fundingPeriodId: undefined,
  childCareSpaceCategoryId: null,
  categoryName: "",
  fromAge: null,
  toAge: null,
  monthlyAmount: undefined,
})

const childCareSpaceCategoriesWhere = computed(() => ({
  fundingPeriodId: administrationCostCategoryAttributes.value.fundingPeriodId,
}))

watch(
  () => administrationCostCategoryAttributes.value.fundingPeriodId,
  () => {
    administrationCostCategoryAttributes.value.childCareSpaceCategoryId = null
  }
)

const headerActionsFormCard = useTemplateRef("headerActionsFormCard")
const isSaving = ref(false)
const snack = useSnack()
const router = useRouter()

async function createCategory() {
  if (isNil(headerActionsFormCard.value) || isSaving.value) return

  const { valid } = await headerActionsFormCard.value.validate()
  if (!valid) return

  isSaving.value = true
  try {
    const { administrationCostCategory } = await administrationCostCategoriesApi.create(
      administrationCostCategoryAttributes.value
    )
    snack.success("Administration cost category created successfully!")
    await router.push({
      name: "administration/administration-cost-categories/AdministrationCostCategoryPage",
      params: {
        administrationCostCategoryId: administrationCostCategory.id,
      },
    })
  } catch (error) {
    snack.error(`Failed to create Administration cost category: ${error}`, { cause: error })
  } finally {
    isSaving.value = false
  }
}

useBreadcrumbs("New Administration Cost Category", [
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
    title: "New Administration Cost Category",
    to: {
      name: "administration/administration-cost-categories/AdministrationCostCategoryNewPage",
    },
  },
])
</script>
