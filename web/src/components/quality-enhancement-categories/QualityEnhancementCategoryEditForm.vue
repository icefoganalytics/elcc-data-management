<template>
  <v-sheet>
    <v-skeleton-loader
      v-if="isLoadingCategory && isNil(qualityEnhancementCategory)"
      type="card"
    />
    <v-alert
      v-else-if="isCategoryErrored && isNil(qualityEnhancementCategory)"
      type="error"
      variant="tonal"
    >
      Quality Enhancement category could not be loaded.
      <v-btn
        variant="text"
        @click="refreshQualityEnhancementCategory"
      >
        Try again
      </v-btn>
    </v-alert>
    <v-alert
      v-else-if="!isNil(qualityEnhancementCategory) && !policy?.update"
      type="error"
      variant="tonal"
    >
      You are not authorized to edit this Quality Enhancement category.
    </v-alert>
    <v-form
      v-else-if="!isNil(qualityEnhancementCategory) && policy?.update"
      ref="form"
      @submit.prevent="validateSaveAndNotify"
    >
      <v-alert
        v-if="isFundingPeriodErrored"
        type="error"
        variant="tonal"
        class="mb-4"
      >
        The funding period could not be loaded. Its association remains unchanged.
        <v-btn
          variant="text"
          @click="refreshFundingPeriod"
        >
          Try again
        </v-btn>
      </v-alert>
      <v-row>
        <v-col cols="12">
          <DescriptionElement
            label="Funding Period"
            :model-value="fundingPeriodDescription"
            :loading="isLoadingFundingPeriod"
            vertical
          />
        </v-col>
      </v-row>
      <v-divider class="my-4" />
      <v-row>
        <v-col cols="12">
          <QualityEnhancementCategoryNameUniqueTextField
            v-model="qualityEnhancementCategory.categoryName"
            :funding-period-id="qualityEnhancementCategory.fundingPeriodId"
            :excluding-category-id="qualityEnhancementCategoryId"
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
            v-model="qualityEnhancementCategory.fromAge"
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
            v-model="qualityEnhancementCategory.toAge"
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
            :model-value="qualityEnhancementCategory.monthlyAmount"
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
            v-model="qualityEnhancementCategory.childCareSpaceCategoryId"
            :where="childCareSpaceCategoriesWhere"
            label="Linked Child Care Space Category"
            clearable
          />
        </v-col>
      </v-row>
      <v-row>
        <v-col class="d-flex justify-end">
          <v-btn
            color="primary"
            :loading="isSaving"
            type="submit"
          >
            Save Changes
          </v-btn>
          <v-spacer />
          <v-btn
            color="warning"
            variant="outlined"
            :loading="isSaving"
            :to="{
              name: 'administration/quality-enhancement-categories/QualityEnhancementCategoryPage',
              params: {
                qualityEnhancementCategoryId,
              },
            }"
          >
            Cancel
          </v-btn>
        </v-col>
      </v-row>
    </v-form>
  </v-sheet>
</template>

<script setup lang="ts">
import { computed, ref, toRefs, useTemplateRef } from "vue"
import { isNil } from "lodash"

import { greaterThan, greaterThanOrEqualTo, required } from "@/utils/validators"

import useQualityEnhancementCategory from "@/use/use-quality-enhancement-category"
import useFundingPeriod from "@/use/use-funding-period"
import useSnack from "@/use/use-snack"

import NumberTextField from "@/components/common/NumberTextField.vue"
import CurrencyInput from "@/components/CurrencyInput.vue"
import DescriptionElement from "@/components/common/DescriptionElement.vue"
import QualityEnhancementCategoryNameUniqueTextField from "@/components/quality-enhancement-categories/QualityEnhancementCategoryNameUniqueTextField.vue"
import ChildCareSpaceCategorySearchableAutocomplete from "@/components/child-care-space-categories/ChildCareSpaceCategorySearchableAutocomplete.vue"

const monthlyAmountOptions = { precision: 4 }

const props = defineProps<{
  qualityEnhancementCategoryId: number
}>()

const emit = defineEmits<{
  saved: [qualityEnhancementCategoryId: number]
}>()

const { qualityEnhancementCategoryId } = toRefs(props)
const {
  qualityEnhancementCategory,
  policy,
  isLoading: isLoadingCategory,
  isErrored: isCategoryErrored,
  refresh: refreshQualityEnhancementCategory,
  save,
} = useQualityEnhancementCategory(qualityEnhancementCategoryId)
const fundingPeriodId = computed(() => qualityEnhancementCategory.value?.fundingPeriodId)
const childCareSpaceCategoriesWhere = computed(() => ({
  fundingPeriodId: fundingPeriodId.value,
}))
const {
  fundingPeriod,
  isLoading: isLoadingFundingPeriod,
  isErrored: isFundingPeriodErrored,
  refresh: refreshFundingPeriod,
} = useFundingPeriod(fundingPeriodId)
const fundingPeriodDescription = computed(() => {
  if (fundingPeriod.value === null) {
    return "Unavailable"
  }

  const { fiscalYear, title } = fundingPeriod.value
  return title ? `${fiscalYear} — ${title}` : fiscalYear
})
const toAgeRules = computed(() => [
  wholeNumberOrEmpty,
  greaterThanOrEqualTo(0),
  greaterThan(qualityEnhancementCategory.value?.fromAge, {
    referenceFieldLabel: `From Age of ${qualityEnhancementCategory.value?.fromAge}`,
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

function updateMonthlyAmount(value: string | number | null) {
  const category = qualityEnhancementCategory.value
  if (isNil(category)) {
    return
  }

  category.monthlyAmount = isNil(value) ? "" : String(value)
}

const isSaving = ref(false)
const snack = useSnack()

async function validateSaveAndNotify() {
  if (!policy.value?.update) return

  if (isNil(qualityEnhancementCategory.value)) {
    return
  }

  if (isNil(form.value)) {
    return
  }

  const { valid } = await form.value.validate()
  if (!valid) {
    return
  }

  isSaving.value = true

  try {
    await save()
    emit("saved", props.qualityEnhancementCategoryId)
    snack.success("Quality Enhancement category saved!")
  } catch (error) {
    console.error(`Failed to update Quality Enhancement category: ${error}`, { error })
    snack.error(`Failed to update Quality Enhancement category: ${error}`)
  } finally {
    isSaving.value = false
  }
}

const form = useTemplateRef("form")
</script>
