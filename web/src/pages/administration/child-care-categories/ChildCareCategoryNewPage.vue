<template>
  <v-alert
    v-if="!isSystemAdmin"
    type="error"
    variant="tonal"
  >
    Only system administrators can create Child Care categories.
  </v-alert>
  <HeaderActionsFormCard
    v-else
    ref="headerActionsFormCard"
    title="New Child Care Category"
    @submit.prevent="createChildCareCategory"
  >
    <FundingPeriodSearchableAutocomplete
      v-model="categoryAttributes.fundingPeriodId"
      label="Funding Period *"
      :select-first-on-load="false"
      :rules="[required]"
      required
    />
    <v-row>
      <v-col cols="12">
        <ChildCareCategoryNameUniqueTextField
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

    <template #actions>
      <v-btn
        :loading="isCreating"
        color="primary"
        variant="flat"
        type="submit"
      >
        Create Child Care Category
      </v-btn>
      <v-spacer />
      <v-btn
        color="warning"
        variant="outlined"
        :loading="isCreating"
        :to="{
          name: 'administration/ChildCareCategoriesPage',
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

import { greaterThanOrEqualTo, required } from "@/utils/validators"

import childCareCategoriesApi, {
  type ChildCareCategoryCreationAttributes,
} from "@/api/child-care-categories-api"
import ApiOperationError from "@/api/errors/api-operation-error"

import useBreadcrumbs from "@/use/use-breadcrumbs"
import useCurrentUser from "@/use/use-current-user"
import useSnack from "@/use/use-snack"

import HeaderActionsFormCard from "@/components/common/HeaderActionsFormCard.vue"
import NumberTextField from "@/components/common/NumberTextField.vue"
import ChildCareCategoryNameUniqueTextField from "@/components/child-care-categories/ChildCareCategoryNameUniqueTextField.vue"
import FundingPeriodSearchableAutocomplete from "@/components/funding-periods/FundingPeriodSearchableAutocomplete.vue"

const { isSystemAdmin } = useCurrentUser()

type CategoryFormAttributes = {
  fundingPeriodId: number | null
  categoryName: string
  fromAge: number | null
  toAge: number | null
}

const categoryAttributes = ref<CategoryFormAttributes>({
  fundingPeriodId: null,
  categoryName: "",
  fromAge: null,
  toAge: null,
})

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

const headerActionsFormCard = ref<InstanceType<typeof HeaderActionsFormCard> | null>(null)
const isCreating = ref(false)
const snack = useSnack()
const router = useRouter()

async function createChildCareCategory() {
  if (!isSystemAdmin.value || isNil(headerActionsFormCard.value)) {
    return
  }

  const { valid } = await headerActionsFormCard.value.validate()
  if (!valid) {
    return
  }

  const { fundingPeriodId, categoryName, fromAge, toAge } = categoryAttributes.value
  if (isNil(fundingPeriodId)) {
    return
  }

  const attributes: ChildCareCategoryCreationAttributes = {
    fundingPeriodId,
    categoryName,
    fromAge,
    toAge,
  }
  isCreating.value = true
  try {
    const { childCareCategory } = await childCareCategoriesApi.create(attributes)
    snack.success("Child Care category created successfully!")
    return router.push({
      name: "administration/child-care-categories/ChildCareCategoryPage",
      params: {
        childCareCategoryId: childCareCategory.id,
      },
    })
  } catch (error) {
    if (error instanceof ApiOperationError) {
      console.error(`Failed to create Child Care category: ${error}`, { error })
      snack.error(`Failed to create Child Care category: ${error}`)
      return
    }

    throw error
  } finally {
    isCreating.value = false
  }
}

useBreadcrumbs("Child Care Category Creation", [
  {
    title: "Administration",
    to: {
      name: "AdministrationPage",
    },
  },
  {
    title: "Child Care Categories",
    to: {
      name: "administration/ChildCareCategoriesPage",
    },
  },
  {
    title: "New Child Care Category",
    to: {
      name: "administration/child-care-categories/ChildCareCategoryNewPage",
    },
  },
])
</script>
