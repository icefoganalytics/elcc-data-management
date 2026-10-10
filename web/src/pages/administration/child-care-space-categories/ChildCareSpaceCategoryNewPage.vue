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
    <v-row>
      <v-col cols="12">
        <ChildCareSpaceCategoryNameUniqueTextField
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
        <v-text-field
          :model-value="categoryAttributes.fromAge"
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
          :model-value="categoryAttributes.toAge"
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
          :model-value="categoryAttributes.monthlyAmount"
          label="Monthly Amount *"
          :options="monthlyAmountOptions"
          :rules="[required]"
          required
          @update:model-value="updateMonthlyAmount"
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
import { computed, ref } from "vue"
import { useRouter } from "vue-router"
import { isNil } from "lodash"

import { MAX_PER_PAGE } from "@/api/base-api"
import { greaterThan, greaterThanOrEqualTo, required } from "@/utils/validators"

import childCareSpaceCategoriesApi, {
  type ChildCareSpaceCategoryCreationAttributes,
} from "@/api/child-care-space-categories-api"
import useBreadcrumbs from "@/use/use-breadcrumbs"
import useFundingPeriods, { type FundingPeriodQueryOptions } from "@/use/use-funding-periods"
import useSnack from "@/use/use-snack"

import CurrencyInput from "@/components/CurrencyInput.vue"
import HeaderActionsFormCard from "@/components/common/HeaderActionsFormCard.vue"
import ChildCareSpaceCategoryNameUniqueTextField from "@/components/child-care-space-categories/ChildCareSpaceCategoryNameUniqueTextField.vue"

const monthlyAmountOptions = { precision: 4 }

type CategoryFormAttributes = {
  fundingPeriodId: number | null
  categoryName: string
  fromAge: number | null
  toAge: number | null
  monthlyAmount: string | null
}

const categoryAttributes = ref<CategoryFormAttributes>({
  fundingPeriodId: null,
  categoryName: "",
  fromAge: null,
  toAge: null,
  monthlyAmount: "",
})

function updateAge(field: "fromAge" | "toAge", value: string | number | null) {
  categoryAttributes.value[field] = isNil(value) || value === "" ? null : Number(value)
}

function updateMonthlyAmount(value: string | number | null) {
  categoryAttributes.value.monthlyAmount = isNil(value) ? null : String(value)
}

const toAgeRules = computed(() => [
  wholeNumberOrEmpty,
  greaterThanOrEqualTo(0),
  greaterThan(categoryAttributes.value.fromAge, {
    referenceFieldLabel: `From Age of ${categoryAttributes.value.fromAge}`,
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
  fundingPeriods.value.map(({ id, fiscalYear, title }) => ({
    title: title ? `${fiscalYear} — ${title}` : fiscalYear,
    value: id,
  }))
)

const headerActionsFormCard = ref<InstanceType<typeof HeaderActionsFormCard> | null>(null)
const isCreating = ref(false)
const snack = useSnack()
const router = useRouter()

async function createChildCareSpaceCategory() {
  if (isNil(headerActionsFormCard.value)) return

  const { valid } = await headerActionsFormCard.value.validate()
  if (!valid) return

  const { fundingPeriodId, categoryName, fromAge, toAge, monthlyAmount } = categoryAttributes.value
  if (isNil(fundingPeriodId) || isNil(monthlyAmount)) return

  const attributes: ChildCareSpaceCategoryCreationAttributes = {
    fundingPeriodId,
    categoryName,
    fromAge,
    toAge,
    monthlyAmount,
  }

  isCreating.value = true
  try {
    const { childCareSpaceCategory } = await childCareSpaceCategoriesApi.create(attributes)
    snack.success("Child Care Space category created successfully!")
    return router.push({
      name: "administration/child-care-space-categories/ChildCareSpaceCategoryPage",
      params: {
        childCareSpaceCategoryId: childCareSpaceCategory.id,
      },
    })
  } catch (error) {
    console.error(`Failed to create Child Care Space category: ${error}`, { error })
    snack.error(`Failed to create Child Care Space category: ${error}`)
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
