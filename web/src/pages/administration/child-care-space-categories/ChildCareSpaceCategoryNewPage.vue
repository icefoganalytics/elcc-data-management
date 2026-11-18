<template>
  <HeaderActionsFormCard
    ref="headerActionsFormCard"
    title="New Child Care Space Category"
    @submit.prevent="createChildCareSpaceCategory"
  >
    <v-alert
      v-if="isFundingPeriodsErrored"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      Funding periods could not be loaded. Reload the page to try again.
    </v-alert>
    <v-row>
      <v-col cols="12">
        <v-select
          v-model="categoryAttributes.fundingPeriodId"
          :items="fundingPeriodItems"
          label="Funding Period *"
          :loading="isLoadingFundingPeriods"
          :error="isFundingPeriodsErrored"
          :error-messages="isFundingPeriodsErrored ? 'Unable to load funding periods.' : undefined"
          item-title="title"
          item-value="value"
          no-data-text="No funding periods available"
          :rules="[required]"
          required
        />
      </v-col>
    </v-row>
    <ChildCareCategorySearchableAutocomplete
      v-model="categoryAttributes.childCareCategoryId"
      :where="childCareCategoriesWhere"
      :disabled="isNil(categoryAttributes.fundingPeriodId)"
      label="Child Care Category *"
      :rules="[required]"
      required
    />
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
        <ChildCareSpaceCategoryPropagationControls
          v-model:apply-to-future-months="applyToFutureMonths"
          v-model:propagation-start-fiscal-period-id="propagationStartFiscalPeriodId"
          :funding-period-id="categoryAttributes.fundingPeriodId"
        />
      </v-col>
    </v-row>

    <template #actions>
      <v-btn
        :loading="isCreating"
        color="primary"
        variant="flat"
        type="submit"
      >
        Create Child Care Space Category
      </v-btn>
      <v-spacer />
      <v-btn
        color="warning"
        variant="outlined"
        :loading="isCreating"
        :to="{
          name: 'administration/ChildCareSpaceCategoriesPage',
        }"
      >
        Cancel
      </v-btn>
    </template>
  </HeaderActionsFormCard>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useRouter } from "vue-router"
import { isNil } from "lodash"

import { MAX_PER_PAGE } from "@/api/base-api"
import { required } from "@/utils/validators"

import childCareSpaceCategoriesApi, {
  type ChildCareSpaceCategoryCreationAttributes,
  type ChildCareSpaceCategoryPropagationOptions,
} from "@/api/child-care-space-categories-api"
import ApiOperationError from "@/api/errors/api-operation-error"

import useBreadcrumbs from "@/use/use-breadcrumbs"
import useFundingPeriods, { type FundingPeriodQueryOptions } from "@/use/use-funding-periods"
import useSnack from "@/use/use-snack"

import CurrencyInput from "@/components/CurrencyInput.vue"
import HeaderActionsFormCard from "@/components/common/HeaderActionsFormCard.vue"
import ChildCareCategorySearchableAutocomplete from "@/components/child-care-categories/ChildCareCategorySearchableAutocomplete.vue"
import ChildCareSpaceCategoryPropagationControls from "@/components/child-care-space-categories/ChildCareSpaceCategoryPropagationControls.vue"

const monthlyAmountOptions = { precision: 4 }

type CategoryFormAttributes = {
  fundingPeriodId: number | null
  childCareCategoryId: number | null
  monthlyAmount: string | null
}

const categoryAttributes = ref<CategoryFormAttributes>({
  fundingPeriodId: null,
  childCareCategoryId: null,
  monthlyAmount: "",
})
const applyToFutureMonths = ref(false)
const propagationStartFiscalPeriodId = ref<number | null>(null)

const childCareCategoriesWhere = computed(() => ({
  fundingPeriodId: categoryAttributes.value.fundingPeriodId ?? undefined,
}))

watch(
  () => categoryAttributes.value.fundingPeriodId,
  () => {
    categoryAttributes.value.childCareCategoryId = null
  }
)

function updateMonthlyAmount(value: string | number | null) {
  categoryAttributes.value.monthlyAmount = isNil(value) ? null : String(value)
}

const fundingPeriodsQuery = computed<FundingPeriodQueryOptions>(() => ({
  order: [["fiscalYear", "DESC"]],
  perPage: MAX_PER_PAGE,
}))
const {
  fundingPeriods,
  isLoading: isLoadingFundingPeriods,
  isErrored: isFundingPeriodsErrored,
} = useFundingPeriods(fundingPeriodsQuery)
const fundingPeriodItems = computed(() =>
  fundingPeriods.value.map(({ id, fiscalYear, title: periodTitle }) => {
    const title = periodTitle ? `${fiscalYear} — ${periodTitle}` : fiscalYear
    const value = id

    return { title, value }
  })
)

const headerActionsFormCard = ref<InstanceType<typeof HeaderActionsFormCard> | null>(null)
const isCreating = ref(false)
const snack = useSnack()
const router = useRouter()

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

async function createChildCareSpaceCategory() {
  if (isNil(headerActionsFormCard.value)) {
    return
  }

  const { valid } = await headerActionsFormCard.value.validate()
  if (!valid) {
    return
  }

  const { fundingPeriodId, childCareCategoryId, monthlyAmount } = categoryAttributes.value
  if (isNil(fundingPeriodId) || isNil(childCareCategoryId) || isNil(monthlyAmount)) {
    return
  }

  const propagationOptions = getPropagationOptions()
  if (propagationOptions === null) {
    return
  }

  const attributes: ChildCareSpaceCategoryCreationAttributes = {
    fundingPeriodId,
    childCareCategoryId,
    monthlyAmount,
    ...(propagationOptions ?? {}),
  }
  isCreating.value = true
  try {
    const { childCareSpaceCategory } = await childCareSpaceCategoriesApi.create(attributes)
    applyToFutureMonths.value = false
    propagationStartFiscalPeriodId.value = null
    snack.success("Child Care Space category created successfully!")
    return router.push({
      name: "administration/child-care-space-categories/ChildCareSpaceCategoryPage",
      params: {
        childCareSpaceCategoryId: childCareSpaceCategory.id,
      },
    })
  } catch (error) {
    if (error instanceof ApiOperationError) {
      console.error(`Failed to create Child Care Space category: ${error}`, { error })
      snack.error(`Failed to create Child Care Space category: ${error}`)
      return
    }

    throw error
  } finally {
    isCreating.value = false
  }
}

useBreadcrumbs("Child Care Space Category Creation", [
  {
    title: "Administration",
    to: {
      name: "AdministrationPage",
    },
  },
  {
    title: "Child Care Space Categories",
    to: {
      name: "administration/ChildCareSpaceCategoriesPage",
    },
  },
  {
    title: "New Child Care Space Category",
    to: {
      name: "administration/child-care-space-categories/ChildCareSpaceCategoryNewPage",
    },
  },
])
</script>
