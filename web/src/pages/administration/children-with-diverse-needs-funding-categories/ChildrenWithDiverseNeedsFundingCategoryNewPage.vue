<template>
  <HeaderActionsFormCard
    ref="form"
    @submit.prevent="createChildrenWithDiverseNeedsFundingCategory"
  >
    <v-row>
      <v-col cols="12">
        <FundingPeriodSearchableAutocomplete
          v-model="childrenWithDiverseNeedsFundingCategoryAttributes.fundingPeriodId"
          :disabled="isCreating"
          :rules="[required]"
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-text-field
          v-model="childrenWithDiverseNeedsFundingCategoryAttributes.categoryName"
          label="Category Name *"
          :rules="[required]"
          :disabled="isCreating"
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col
        cols="12"
        md="6"
      >
        <NumberTextField
          v-model="childrenWithDiverseNeedsFundingCategoryAttributes.fromAge"
          label="From Age"
          min="0"
          step="1"
          :disabled="isCreating"
        />
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <NumberTextField
          v-model="childrenWithDiverseNeedsFundingCategoryAttributes.toAge"
          label="To Age"
          min="0"
          step="1"
          :disabled="isCreating"
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <CurrencyInput
          v-model="childrenWithDiverseNeedsFundingCategoryAttributes.monthlyAmount"
          label="Monthly Amount *"
          :rules="[required]"
          :disabled="isCreating"
        />
      </v-col>
    </v-row>
    <template #actions>
      <v-btn
        type="submit"
        color="primary"
        :loading="isCreating"
        >Create</v-btn
      >
      <v-spacer />
      <v-btn
        color="warning"
        variant="outlined"
        :to="{
          name: 'administration/ChildrenWithDiverseNeedsFundingCategoriesPage',
        }"
        :loading="isCreating"
        >Cancel</v-btn
      >
    </template>
  </HeaderActionsFormCard>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from "vue"
import { useRouteQuery } from "@vueuse/router"
import { useRoute, useRouter } from "vue-router"
import { isNil } from "lodash"

import childrenWithDiverseNeedsFundingCategoriesApi, {
  type ChildrenWithDiverseNeedsFundingCategoryCreationAttributes,
} from "@/api/children-with-diverse-needs-funding-categories-api"
import rethrowUnexpectedError from "@/api/errors/rethrow-unexpected-error"

import { required } from "@/utils/validators"
import { integerTransformer } from "@/utils/use-route-query-transformers"

import useBreadcrumbs from "@/use/use-breadcrumbs"
import useSnack from "@/use/use-snack"

import CurrencyInput from "@/components/CurrencyInput.vue"
import HeaderActionsFormCard from "@/components/common/HeaderActionsFormCard.vue"
import NumberTextField from "@/components/common/NumberTextField.vue"
import FundingPeriodSearchableAutocomplete from "@/components/funding-periods/FundingPeriodSearchableAutocomplete.vue"

const route = useRoute()
const router = useRouter()

const fundingPeriodId = useRouteQuery<string | undefined, number | undefined>(
  "fundingPeriodId",
  undefined,
  {
    transform: integerTransformer,
  }
)

const childrenWithDiverseNeedsFundingCategoryAttributes = ref<
  Partial<ChildrenWithDiverseNeedsFundingCategoryCreationAttributes>
>({
  fundingPeriodId: fundingPeriodId.value,
  categoryName: "",
  fromAge: null,
  toAge: null,
  monthlyAmount: "",
})

const isCreating = ref(false)

const form = useTemplateRef("form")

const snack = useSnack()

async function createChildrenWithDiverseNeedsFundingCategory() {
  if (isCreating.value || form.value === null) return

  const { valid } = await form.value.validate()
  if (!valid) return

  const { fundingPeriodId, categoryName, monthlyAmount } =
    childrenWithDiverseNeedsFundingCategoryAttributes.value
  if (isNil(fundingPeriodId) || isNil(categoryName) || isNil(monthlyAmount)) return

  isCreating.value = true
  try {
    const { childrenWithDiverseNeedsFundingCategory } =
      await childrenWithDiverseNeedsFundingCategoriesApi.create({
        ...childrenWithDiverseNeedsFundingCategoryAttributes.value,
        fundingPeriodId,
        categoryName,
        monthlyAmount,
      })

    snack.success("Diverse need category created successfully!")
    await router.push({
      name: "administration/children-with-diverse-needs-funding-categories/ChildrenWithDiverseNeedsFundingCategoryPage",
      params: {
        childrenWithDiverseNeedsFundingCategoryId: childrenWithDiverseNeedsFundingCategory.id,
      },
    })
  } catch (error) {
    rethrowUnexpectedError(error)

    snack.error(`Failed to create diverse need category: ${error}`)
  } finally {
    isCreating.value = false
  }
}

useBreadcrumbs("New Diverse Need Category", [
  {
    title: "Administration",
    to: {
      name: "AdministrationPage",
    },
  },
  {
    title: "Diverse Need Categories",
    to: {
      name: "administration/ChildrenWithDiverseNeedsFundingCategoriesPage",
    },
  },
  {
    title: "New Category",
    to: {
      name: "administration/children-with-diverse-needs-funding-categories/ChildrenWithDiverseNeedsFundingCategoryNewPage",
      query: route.query,
    },
  },
])
</script>
