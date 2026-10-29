<template>
  <HeaderActionsFormCard
    ref="form"
    title="New Administration Cost Category"
    @submit.prevent="createCategory"
  >
    <FundingPeriodSearchableAutocomplete
      v-model="fundingPeriodId"
      label="Funding Period *"
      :select-first-on-load="false"
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
      :rules="[required]"
    />
    <ChildCareSpaceCategorySearchableAutocomplete
      v-model="childCareSpaceCategoryId"
      :where="childCareSpaceCategoriesWhere"
      label="Linked Child Care Space Category"
      :disabled="isNil(fundingPeriodId)"
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

import administrationCostCategoriesApi from "@/api/administration-cost-categories-api"

import useBreadcrumbs from "@/use/use-breadcrumbs"
import useSnack from "@/use/use-snack"

import CurrencyInput from "@/components/CurrencyInput.vue"
import HeaderActionsFormCard from "@/components/common/HeaderActionsFormCard.vue"
import ChildCareSpaceCategorySearchableAutocomplete from "@/components/child-care-space-categories/ChildCareSpaceCategorySearchableAutocomplete.vue"
import FundingPeriodSearchableAutocomplete from "@/components/funding-periods/FundingPeriodSearchableAutocomplete.vue"

const router = useRouter()
const snack = useSnack()

const form = useTemplateRef("form")
const fundingPeriodId = ref<number | null>(null)
const categoryName = ref("")
const fromAge = ref<string | number | null>(null)
const toAge = ref<string | number | null>(null)
const monthlyAmount = ref<string | null>(null)
const childCareSpaceCategoryId = ref<number | null>(null)
const isSaving = ref(false)

const childCareSpaceCategoriesWhere = computed(() => ({
  fundingPeriodId: fundingPeriodId.value ?? undefined,
}))

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
      params: {
        administrationCostCategoryId: administrationCostCategory.id,
      },
    })
  } catch (error) {
    snack.error(`Failed to create Administration cost category: ${error}`)
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
