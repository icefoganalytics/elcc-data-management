<template>
  <v-alert
    v-if="!isSystemAdmin"
    type="error"
    variant="tonal"
  >
    Only system administrators can create Quality Enhancement categories.
  </v-alert>
  <v-alert
    v-else-if="isFundingPeriodsErrored"
    type="error"
    variant="tonal"
    class="mb-4"
  >
    Funding periods could not be loaded.
    <v-btn
      variant="text"
      @click="refreshFundingPeriods"
    >
      Try again
    </v-btn>
  </v-alert>
  <v-empty-state
    v-else-if="!isLoadingFundingPeriods && fundingPeriodsCount === 0"
    headline="No Funding Periods Found"
    title="Create a funding period before adding Quality Enhancement categories."
  />
  <HeaderActionsFormCard
    v-else
    ref="headerActionsFormCard"
    title="New Quality Enhancement Category"
    @submit.prevent="createQualityEnhancementCategory"
  >
    <v-row>
      <v-col cols="12">
        <FundingPeriodSearchableAutocomplete
          v-model="categoryAttributes.fundingPeriodId"
          label="Funding Period *"
          :select-first-on-load="false"
          :rules="[required]"
          required
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <QualityEnhancementCategoryNameUniqueTextField
          ref="categoryNameField"
          v-model="categoryAttributes.categoryName"
          :funding-period-id="categoryAttributes.fundingPeriodId"
          label="Category Name *"
          :rules="[required]"
          required
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col
        cols="12"
        md="6"
      >
        <NumberTextField
          v-model="categoryAttributes.fromAge"
          label="From Age"
          step="1"
          min="0"
          :rules="[wholeNumberOrEmpty, greaterThanOrEqualTo(0)]"
        />
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <NumberTextField
          v-model="categoryAttributes.toAge"
          label="To Age"
          step="1"
          min="0"
          :rules="toAgeRules"
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <CurrencyInput
          :model-value="categoryAttributes.monthlyAmount"
          label="Monthly Amount *"
          :options="monthlyAmountOptions"
          :rules="[required]"
          required
          @update:model-value="updateMonthlyAmount"
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <ChildCareSpaceCategorySearchableAutocomplete
          v-model="categoryAttributes.childCareSpaceCategoryId"
          :where="childCareSpaceCategoriesWhere"
          :disabled="isNil(categoryAttributes.fundingPeriodId)"
          label="Linked Child Care Space Category"
          clearable
        />
      </v-col>
    </v-row>

    <template #actions>
      <v-btn
        :loading="isCreating"
        :disabled="isLoadingFundingPeriods"
        color="primary"
        variant="flat"
        type="submit"
      >
        Create Quality Enhancement Category
      </v-btn>
      <v-spacer />
      <v-btn
        color="warning"
        variant="outlined"
        :loading="isCreating"
        :to="{
          name: 'administration/QualityEnhancementCategoriesPage',
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

import { greaterThanOrEqualTo, required } from "@/utils/validators"

import qualityEnhancementCategoriesApi, {
  type QualityEnhancementCategoryCreationAttributes,
} from "@/api/quality-enhancement-categories-api"
import rethrowUnexpectedError from "@/api/errors/rethrow-unexpected-error"

import useBreadcrumbs from "@/use/use-breadcrumbs"
import useCurrentUser from "@/use/use-current-user"
import useFundingPeriods, { type FundingPeriodQueryOptions } from "@/use/use-funding-periods"
import useSnack from "@/use/use-snack"

import NumberTextField from "@/components/common/NumberTextField.vue"
import CurrencyInput from "@/components/CurrencyInput.vue"
import HeaderActionsFormCard from "@/components/common/HeaderActionsFormCard.vue"
import FundingPeriodSearchableAutocomplete from "@/components/funding-periods/FundingPeriodSearchableAutocomplete.vue"
import QualityEnhancementCategoryNameUniqueTextField from "@/components/quality-enhancement-categories/QualityEnhancementCategoryNameUniqueTextField.vue"
import ChildCareSpaceCategorySearchableAutocomplete from "@/components/child-care-space-categories/ChildCareSpaceCategorySearchableAutocomplete.vue"

const monthlyAmountOptions = { precision: 4 }

const { isSystemAdmin } = useCurrentUser()

const categoryAttributes = ref<Partial<QualityEnhancementCategoryCreationAttributes>>({
  fundingPeriodId: undefined,
  categoryName: "",
  fromAge: null,
  toAge: null,
  monthlyAmount: "",
  childCareSpaceCategoryId: null,
})
const categoryNameField = useTemplateRef("categoryNameField")

const childCareSpaceCategoriesWhere = computed(() => ({
  fundingPeriodId: categoryAttributes.value.fundingPeriodId,
}))

watch(
  () => categoryAttributes.value.fundingPeriodId,
  async () => {
    await categoryNameField.value?.validate()
  }
)

watch(
  () => categoryAttributes.value.fundingPeriodId,
  (_fundingPeriodId, previousFundingPeriodId) => {
    if (!isNil(previousFundingPeriodId)) {
      categoryAttributes.value.childCareSpaceCategoryId = null
    }
  }
)

function updateMonthlyAmount(value: string | number | null) {
  categoryAttributes.value.monthlyAmount = isNil(value) ? undefined : String(value)
}

const toAgeRules = computed(() => [
  wholeNumberOrEmpty,
  greaterThanOrEqualTo(0),
  greaterThanOrEqualTo(categoryAttributes.value.fromAge ?? 0, {
    referenceFieldLabel: `From Age of ${categoryAttributes.value.fromAge}`,
  }),
])

function wholeNumberOrEmpty(value: unknown): boolean | string {
  if (isNil(value) || value === "") {
    return true
  }

  if (typeof value === "number" && Number.isInteger(value)) {
    return true
  }

  if (typeof value === "string" && value.trim() !== "" && Number.isInteger(Number(value))) {
    return true
  }

  return "Age must be a whole number"
}

const fundingPeriodsQuery = ref<FundingPeriodQueryOptions>({ perPage: 1 })
const {
  totalCount: fundingPeriodsCount,
  isLoading: isLoadingFundingPeriods,
  isErrored: isFundingPeriodsErrored,
  refresh: refreshFundingPeriods,
} = useFundingPeriods(fundingPeriodsQuery)

const headerActionsFormCard = useTemplateRef("headerActionsFormCard")
const isCreating = ref(false)
const snack = useSnack()
const router = useRouter()

async function createQualityEnhancementCategory() {
  if (!isSystemAdmin.value) return

  if (isNil(headerActionsFormCard.value) || isCreating.value) {
    return
  }

  const { valid } = await headerActionsFormCard.value.validate()
  if (!valid) {
    return
  }

  const { fundingPeriodId, categoryName, fromAge, toAge, monthlyAmount } = categoryAttributes.value
  if (isNil(fundingPeriodId) || isNil(categoryName) || isNil(monthlyAmount)) {
    return
  }

  const attributes: QualityEnhancementCategoryCreationAttributes = {
    fundingPeriodId,
    categoryName,
    fromAge: fromAge ?? null,
    toAge: toAge ?? null,
    monthlyAmount,
    childCareSpaceCategoryId: categoryAttributes.value.childCareSpaceCategoryId ?? null,
  }
  isCreating.value = true
  try {
    const { qualityEnhancementCategory } = await qualityEnhancementCategoriesApi.create(attributes)
    snack.success("Quality Enhancement category created successfully!")
    return router.push({
      name: "administration/quality-enhancement-categories/QualityEnhancementCategoryPage",
      params: {
        qualityEnhancementCategoryId: qualityEnhancementCategory.id,
      },
    })
  } catch (error) {
    rethrowUnexpectedError(error)

    console.error(`Failed to create Quality Enhancement category: ${error}`, { error })
    snack.error(`Failed to create Quality Enhancement category: ${error}`)
  } finally {
    isCreating.value = false
  }
}

useBreadcrumbs("Quality Enhancement Category Creation", [
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
    title: "New Quality Enhancement Category",
    to: {
      name: "administration/quality-enhancement-categories/QualityEnhancementCategoryNewPage",
    },
  },
])
</script>
