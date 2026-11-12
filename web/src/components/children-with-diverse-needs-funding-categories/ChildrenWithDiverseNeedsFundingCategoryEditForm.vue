<template>
  <HeaderActionsFormCard
    ref="form"
    title="Edit Diverse Need Category"
    @submit.prevent="submit"
  >
    <v-row>
      <v-col cols="12">
        <v-text-field
          :model-value="fundingPeriodDescription"
          append-inner-icon="mdi-lock"
          label="Funding Period"
          readonly
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-text-field
          v-model="childrenWithDiverseNeedsFundingCategory.categoryName"
          :disabled="isSaving"
          label="Category Name *"
          :rules="[required]"
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col
        cols="12"
        md="6"
      >
        <NumberTextField
          v-model="childrenWithDiverseNeedsFundingCategory.fromAge"
          :disabled="isSaving"
          label="From Age"
          min="0"
          step="1"
        />
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <NumberTextField
          v-model="childrenWithDiverseNeedsFundingCategory.toAge"
          :disabled="isSaving"
          label="To Age"
          min="0"
          step="1"
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <CurrencyInput
          v-model="childrenWithDiverseNeedsFundingCategory.monthlyAmount"
          :disabled="isSaving"
          label="Monthly Amount *"
          :rules="[required]"
        />
      </v-col>
    </v-row>
    <template #actions>
      <v-btn
        type="submit"
        color="primary"
        :loading="isSaving"
        >Save Changes</v-btn
      >
      <v-spacer />
      <v-btn
        color="warning"
        variant="outlined"
        :disabled="isSaving"
        @click="emit('cancel')"
        >Cancel</v-btn
      >
    </template>
  </HeaderActionsFormCard>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from "vue"

import childrenWithDiverseNeedsFundingCategoriesApi, {
  type ChildrenWithDiverseNeedsFundingCategory,
  type ChildrenWithDiverseNeedsFundingCategoryPolicy,
} from "@/api/children-with-diverse-needs-funding-categories-api"
import rethrowUnexpectedError from "@/api/errors/rethrow-unexpected-error"

import { required } from "@/utils/validators"

import useSnack from "@/use/use-snack"

import CurrencyInput from "@/components/CurrencyInput.vue"
import HeaderActionsFormCard from "@/components/common/HeaderActionsFormCard.vue"
import NumberTextField from "@/components/common/NumberTextField.vue"

const childrenWithDiverseNeedsFundingCategory =
  defineModel<ChildrenWithDiverseNeedsFundingCategory>("childrenWithDiverseNeedsFundingCategory", {
    required: true,
  })

defineProps<{
  fundingPeriodDescription: string
}>()

const emit = defineEmits<{
  cancel: []
  saved: [policy: ChildrenWithDiverseNeedsFundingCategoryPolicy]
}>()

const form = useTemplateRef("form")

const isSaving = ref(false)
const snack = useSnack()

async function submit() {
  if (isSaving.value || form.value === null) return

  const { valid } = await form.value.validate()
  if (!valid) return

  isSaving.value = true
  try {
    const { id, categoryName, fromAge, toAge, monthlyAmount } =
      childrenWithDiverseNeedsFundingCategory.value
    const { childrenWithDiverseNeedsFundingCategory: savedCategory, policy } =
      await childrenWithDiverseNeedsFundingCategoriesApi.update(id, {
        categoryName,
        fromAge,
        toAge,
        monthlyAmount,
      })
    if (childrenWithDiverseNeedsFundingCategory.value.id !== id) return

    childrenWithDiverseNeedsFundingCategory.value = savedCategory
    snack.success("Diverse need category updated successfully!")
    emit("saved", policy)
  } catch (error) {
    rethrowUnexpectedError(error)

    snack.error(`Failed to update diverse need category: ${error}`)
  } finally {
    isSaving.value = false
  }
}
</script>
