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
    <ChildCareCategorySearchableAutocomplete
      v-model="administrationCostCategoryAttributes.childCareCategoryId"
      :where="childCareCategoriesWhere"
      :disabled="isNil(administrationCostCategoryAttributes.fundingPeriodId)"
      label="Child Care Category *"
      :rules="[required]"
      required
    />
    <CurrencyInput
      v-model="administrationCostCategoryAttributes.monthlyAmount"
      label="Monthly Amount *"
      :rules="[required]"
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
  type AdministrationCostCategoryCreationAttributes,
} from "@/api/administration-cost-categories-api"

import ApiOperationError from "@/api/errors/api-operation-error"

import useBreadcrumbs from "@/use/use-breadcrumbs"
import useSnack from "@/use/use-snack"

import CurrencyInput from "@/components/CurrencyInput.vue"
import HeaderActionsFormCard from "@/components/common/HeaderActionsFormCard.vue"
import ChildCareCategorySearchableAutocomplete from "@/components/child-care-categories/ChildCareCategorySearchableAutocomplete.vue"
import FundingPeriodSearchableAutocomplete from "@/components/funding-periods/FundingPeriodSearchableAutocomplete.vue"

type CategoryFormAttributes = {
  [Attribute in keyof AdministrationCostCategoryCreationAttributes]:
    | AdministrationCostCategoryCreationAttributes[Attribute]
    | null
}

const administrationCostCategoryAttributes = ref<CategoryFormAttributes>({
  fundingPeriodId: null,
  childCareCategoryId: null,
  monthlyAmount: null,
})

const childCareCategoriesWhere = computed(() => ({
  fundingPeriodId: administrationCostCategoryAttributes.value.fundingPeriodId ?? undefined,
}))

watch(
  () => administrationCostCategoryAttributes.value.fundingPeriodId,
  () => {
    administrationCostCategoryAttributes.value.childCareCategoryId = null
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

  const { fundingPeriodId, childCareCategoryId, monthlyAmount } =
    administrationCostCategoryAttributes.value
  if (isNil(fundingPeriodId) || isNil(childCareCategoryId) || isNil(monthlyAmount)) return

  isSaving.value = true
  try {
    const { administrationCostCategory } = await administrationCostCategoriesApi.create({
      fundingPeriodId,
      childCareCategoryId,
      monthlyAmount,
    })
    snack.success("Administration cost category created successfully!")
    await router.push({
      name: "administration/administration-cost-categories/AdministrationCostCategoryPage",
      params: {
        administrationCostCategoryId: administrationCostCategory.id,
      },
    })
  } catch (error) {
    if (error instanceof ApiOperationError) {
      console.error(`Failed to create Administration cost category: ${error}`, { error })
      snack.error(`Failed to create Administration cost category: ${error}`)
      return
    }

    throw error
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
