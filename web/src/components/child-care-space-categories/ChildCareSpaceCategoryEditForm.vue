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
    <ChildCareCategoryDescriptionFields
      :child-care-category-id="childCareSpaceCategory.childCareCategoryId"
      :category="childCareSpaceCategory"
    />
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
      <v-col cols="12">
        <ChildCareSpaceCategoryPropagationControls
          v-model:apply-to-future-months="applyToFutureMonths"
          v-model:propagation-start-fiscal-period-id="propagationStartFiscalPeriodId"
          :funding-period-id="fundingPeriodId"
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

import { ApiOperationError } from "@/api/errors/api-operation-error"

import { type ChildCareSpaceCategoryPropagationOptions } from "@/api/child-care-space-categories-api"
import { required } from "@/utils/validators"

import useChildCareSpaceCategory from "@/use/use-child-care-space-category"
import useFundingPeriod from "@/use/use-funding-period"
import useSnack from "@/use/use-snack"

import CurrencyInput from "@/components/CurrencyInput.vue"
import DescriptionElement from "@/components/common/DescriptionElement.vue"
import ChildCareCategoryDescriptionFields from "@/components/child-care-categories/ChildCareCategoryDescriptionFields.vue"
import ChildCareSpaceCategoryPropagationControls from "@/components/child-care-space-categories/ChildCareSpaceCategoryPropagationControls.vue"

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
const applyToFutureMonths = ref(false)
const propagationStartFiscalPeriodId = ref<number | null>(null)
const fundingPeriodId = computed(() => childCareSpaceCategory.value?.fundingPeriodId)
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

function updateMonthlyAmount(value: string | number | null) {
  const category = childCareSpaceCategory.value
  if (isNil(category)) {
    return
  }

  category.monthlyAmount = isNil(value) ? "" : String(value)
}

const isSaving = ref(false)
const snack = useSnack()

function getPropagationOptions(): ChildCareSpaceCategoryPropagationOptions | undefined | null {
  if (!applyToFutureMonths.value) {
    return undefined
  }

  const fiscalPeriodId = propagationStartFiscalPeriodId.value
  if (isNil(fiscalPeriodId) || !Number.isSafeInteger(fiscalPeriodId) || fiscalPeriodId < 0) {
    return null
  }

  return {
    applyToFutureMonths: true,
    propagationStartFiscalPeriodId: fiscalPeriodId,
  }
}

async function validateSaveAndNotify() {
  if (isNil(childCareSpaceCategory.value)) {
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
    const propagationOptions = getPropagationOptions()
    if (propagationOptions === null) {
      return
    }

    await save(propagationOptions)
    applyToFutureMonths.value = false
    propagationStartFiscalPeriodId.value = null
    emit("saved", props.childCareSpaceCategoryId)
    snack.success("Child Care Space category saved!")
  } catch (error) {
    if (error instanceof ApiOperationError) {
      console.error(`Failed to update Child Care Space category: ${error}`, { error })
      snack.error(`Failed to update Child Care Space category: ${error}`)
      return
    }

    throw error
  } finally {
    isSaving.value = false
  }
}

const form = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null)
</script>
