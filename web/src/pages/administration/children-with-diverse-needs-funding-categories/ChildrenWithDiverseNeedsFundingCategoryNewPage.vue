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
        :loading="isCreating"
        :to="{
          name: 'administration/ChildrenWithDiverseNeedsFundingCategoriesPage',
        }"
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
  if (isNil(form.value)) return

  const { valid } = await form.value.validate()
  if (!valid) return

  isCreating.value = true
  try {
    const { childrenWithDiverseNeedsFundingCategory } =
      await childrenWithDiverseNeedsFundingCategoriesApi.create(
        childrenWithDiverseNeedsFundingCategoryAttributes.value as ChildrenWithDiverseNeedsFundingCategoryCreationAttributes
      )

    snack.success("Children with Diverse Needs category created successfully!")
    await router.push({
      name: "administration/children-with-diverse-needs-funding-categories/ChildrenWithDiverseNeedsFundingCategoryPage",
      params: {
        childrenWithDiverseNeedsFundingCategoryId: childrenWithDiverseNeedsFundingCategory.id,
      },
    })
  } catch (error) {
    rethrowUnexpectedError(error)

    snack.error(`Failed to create Children with Diverse Needs category: ${error}`)
  } finally {
    isCreating.value = false
  }
}

useBreadcrumbs("New Children with Diverse Needs Category", [
  {
    title: "Administration",
    to: {
      name: "AdministrationPage",
    },
  },
  {
    title: "Children with Diverse Needs Categories",
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
