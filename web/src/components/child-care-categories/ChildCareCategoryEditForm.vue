<template>
  <v-skeleton-loader
    v-if="isLoadingCategory && isNil(childCareCategory)"
    type="card"
  />
  <v-alert
    v-else-if="isCategoryErrored && isNil(childCareCategory)"
    type="error"
    variant="tonal"
  >
    Child Care category could not be loaded.
  </v-alert>
  <v-form
    v-else-if="!isNil(childCareCategory) && policy?.update"
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
        <ChildCareCategoryNameUniqueTextField
          v-model="childCareCategory.categoryName"
          :funding-period-id="childCareCategory.fundingPeriodId"
          :excluding-category-id="childCareCategoryId"
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
          v-model="childCareCategory.fromAge"
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
          v-model="childCareCategory.toAge"
          label="To Age"
          step="1"
          min="0"
          :rules="toAgeRules"
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
            name: 'administration/child-care-categories/ChildCareCategoryPage',
            params: {
              childCareCategoryId,
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

import { ApiOperationError } from "@/api/errors/api-operation-error"

import { greaterThanOrEqualTo, required } from "@/utils/validators"

import useChildCareCategory from "@/use/use-child-care-category"
import useFundingPeriod from "@/use/use-funding-period"
import useSnack from "@/use/use-snack"

import DescriptionElement from "@/components/common/DescriptionElement.vue"
import NumberTextField from "@/components/common/NumberTextField.vue"
import ChildCareCategoryNameUniqueTextField from "@/components/child-care-categories/ChildCareCategoryNameUniqueTextField.vue"

const props = defineProps<{
  childCareCategoryId: number
}>()

const emit = defineEmits<{
  saved: [childCareCategoryId: number]
}>()

const { childCareCategoryId } = toRefs(props)
const {
  childCareCategory,
  policy,
  isLoading: isLoadingCategory,
  isErrored: isCategoryErrored,
  save,
} = useChildCareCategory(childCareCategoryId)
const fundingPeriodId = computed(() => childCareCategory.value?.fundingPeriodId)
const {
  fundingPeriod,
  isLoading: isLoadingFundingPeriod,
  isErrored: isFundingPeriodErrored,
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
  greaterThanOrEqualTo(childCareCategory.value?.fromAge ?? 0, {
    referenceFieldLabel: `From Age of ${childCareCategory.value?.fromAge}`,
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

const isSaving = ref(false)
const snack = useSnack()

async function validateSaveAndNotify() {
  if (!policy.value?.update || isNil(childCareCategory.value)) {
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
    emit("saved", props.childCareCategoryId)
    snack.success("Child Care category saved!")
  } catch (error) {
    if (error instanceof ApiOperationError) {
      console.error(`Failed to update Child Care category: ${error}`, { error })
      snack.error(`Failed to update Child Care category: ${error}`)
      return
    }

    throw error
  } finally {
    isSaving.value = false
  }
}

const form = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null)
</script>
