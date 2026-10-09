<template>
  <v-skeleton-loader
    v-if="isLoadingCategory && isNil(childCareSpaceCategory)"
    type="card"
  />
  <v-alert
    v-else-if="isCategoryErrored && isNil(childCareSpaceCategory)"
    type="error"
    variant="tonal"
  >
    Child Care Space category could not be loaded.
  </v-alert>
  <v-form
    v-else-if="!isNil(childCareSpaceCategory)"
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
        <ChildCareSpaceCategoryNameUniqueTextField
          v-model="childCareSpaceCategory.categoryName"
          :funding-period-id="childCareSpaceCategory.fundingPeriodId"
          :excluding-category-id="childCareSpaceCategoryId"
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
        <v-text-field
          :model-value="childCareSpaceCategory.fromAge"
          label="From Age"
          type="number"
          step="1"
          min="0"
          :rules="[wholeNumberOrEmpty, greaterThanOrEqualTo(0)]"
          @update:model-value="updateAge('fromAge', $event)"
        />
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <v-text-field
          :model-value="childCareSpaceCategory.toAge"
          label="To Age"
          type="number"
          step="1"
          min="0"
          :rules="toAgeRules"
          @update:model-value="updateAge('toAge', $event)"
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <CurrencyInput
          :model-value="childCareSpaceCategory.monthlyAmount"
          label="Monthly Amount *"
          :options="monthlyAmountOptions"
          :rules="[required]"
          required
          @update:model-value="updateMonthlyAmount"
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
            name: 'administration/child-care-space-categories/ChildCareSpaceCategoryPage',
            params: {
              childCareSpaceCategoryId,
            },
          }"
        >
          Cancel
        </v-btn>
      </v-col>
    </v-row>
  </v-form>
</template>

<script setup lang="ts">
import { computed, ref, toRefs } from "vue"
import { isNil } from "lodash"

import { greaterThan, greaterThanOrEqualTo, required } from "@/utils/validators"

import useChildCareSpaceCategory from "@/use/use-child-care-space-category"
import useFundingPeriod from "@/use/use-funding-period"
import useSnack from "@/use/use-snack"

import CurrencyInput from "@/components/CurrencyInput.vue"
import DescriptionElement from "@/components/common/DescriptionElement.vue"
import ChildCareSpaceCategoryNameUniqueTextField from "@/components/child-care-space-categories/ChildCareSpaceCategoryNameUniqueTextField.vue"

const monthlyAmountOptions = { precision: 4 }

const props = defineProps<{
  childCareSpaceCategoryId: number
}>()

const emit = defineEmits<{
  saved: [childCareSpaceCategoryId: number]
}>()

const { childCareSpaceCategoryId } = toRefs(props)
const {
  childCareSpaceCategory,
  isLoading: isLoadingCategory,
  isErrored: isCategoryErrored,
  save,
} = useChildCareSpaceCategory(childCareSpaceCategoryId)
const fundingPeriodId = computed(() => childCareSpaceCategory.value?.fundingPeriodId)
const {
  fundingPeriod,
  isLoading: isLoadingFundingPeriod,
  isErrored: isFundingPeriodErrored,
} = useFundingPeriod(fundingPeriodId)
const fundingPeriodDescription = computed(() => {
  if (fundingPeriod.value === null) return "Unavailable"

  const { fiscalYear, title } = fundingPeriod.value
  return title ? `${fiscalYear} — ${title}` : fiscalYear
})
const toAgeRules = computed(() => [
  wholeNumberOrEmpty,
  greaterThanOrEqualTo(0),
  greaterThan(childCareSpaceCategory.value?.fromAge, {
    referenceFieldLabel: `From Age of ${childCareSpaceCategory.value?.fromAge}`,
  }),
])

function wholeNumberOrEmpty(value: unknown): boolean | string {
  if (isNil(value) || value === "") return true
  if (typeof value === "number" && Number.isInteger(value)) return true
  if (typeof value === "string" && value.trim() !== "" && Number.isInteger(Number(value))) {
    return true
  }

  return "Age must be a whole number"
}

function updateAge(field: "fromAge" | "toAge", value: string | number | null) {
  const category = childCareSpaceCategory.value
  if (isNil(category)) return

  category[field] = isNil(value) || value === "" ? null : Number(value)
}

function updateMonthlyAmount(value: string | number | null) {
  const category = childCareSpaceCategory.value
  if (isNil(category)) return

  category.monthlyAmount = isNil(value) ? "" : String(value)
}

const isSaving = ref(false)
const snack = useSnack()

async function validateSaveAndNotify() {
  if (isNil(childCareSpaceCategory.value)) return
  if (isNil(form.value)) return

  const { valid } = await form.value.validate()
  if (!valid) return

  isSaving.value = true
  try {
    await save()
    emit("saved", props.childCareSpaceCategoryId)
    snack.success("Child Care Space category saved!")
  } catch (error) {
    console.error(`Failed to update Child Care Space category: ${error}`, { error })
    snack.error(`Failed to update Child Care Space category: ${error}`)
  } finally {
    isSaving.value = false
  }
}

const form = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null)
</script>
