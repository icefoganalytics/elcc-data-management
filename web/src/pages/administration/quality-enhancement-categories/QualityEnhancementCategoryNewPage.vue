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

import { required } from "@/utils/validators"

import qualityEnhancementCategoriesApi, {
  type QualityEnhancementCategoryCreationAttributes,
} from "@/api/quality-enhancement-categories-api"
import rethrowUnexpectedError from "@/api/errors/rethrow-unexpected-error"

import useBreadcrumbs from "@/use/use-breadcrumbs"
import useCurrentUser from "@/use/use-current-user"
import useFundingPeriods, { type FundingPeriodQueryOptions } from "@/use/use-funding-periods"
import useSnack from "@/use/use-snack"

import CurrencyInput from "@/components/CurrencyInput.vue"
import HeaderActionsFormCard from "@/components/common/HeaderActionsFormCard.vue"
import FundingPeriodSearchableAutocomplete from "@/components/funding-periods/FundingPeriodSearchableAutocomplete.vue"
import ChildCareCategorySearchableAutocomplete from "@/components/child-care-categories/ChildCareCategorySearchableAutocomplete.vue"

const monthlyAmountOptions = { precision: 4 }

const { isSystemAdmin } = useCurrentUser()

type CategoryFormAttributes = {
  [Attribute in keyof QualityEnhancementCategoryCreationAttributes]:
    | QualityEnhancementCategoryCreationAttributes[Attribute]
    | null
}

const categoryAttributes = ref<CategoryFormAttributes>({
  fundingPeriodId: null,
  monthlyAmount: "",
  childCareCategoryId: null,
})

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

  const { fundingPeriodId, childCareCategoryId, monthlyAmount } = categoryAttributes.value
  if (isNil(fundingPeriodId) || isNil(childCareCategoryId) || isNil(monthlyAmount)) {
    return
  }

  const attributes: QualityEnhancementCategoryCreationAttributes = {
    fundingPeriodId,
    childCareCategoryId,
    monthlyAmount,
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
