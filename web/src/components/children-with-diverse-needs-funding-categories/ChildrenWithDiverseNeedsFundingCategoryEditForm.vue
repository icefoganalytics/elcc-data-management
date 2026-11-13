<template>
  <v-skeleton-loader
    v-if="isNil(childrenWithDiverseNeedsFundingCategory)"
    type="card"
  />
  <HeaderActionsFormCard
    v-else
    ref="form"
    title="Edit Diverse Need Category"
    @submit.prevent="submit"
  >
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
        :to="{
          name: 'administration/children-with-diverse-needs-funding-categories/ChildrenWithDiverseNeedsFundingCategoryPage',
          params: {
            childrenWithDiverseNeedsFundingCategoryId,
          },
        }"
        >Cancel</v-btn
      >
    </template>
  </HeaderActionsFormCard>
</template>

<script setup lang="ts">
import { ref, toRefs, useTemplateRef } from "vue"
import { isNil } from "lodash"

import rethrowUnexpectedError from "@/api/errors/rethrow-unexpected-error"

import { required } from "@/utils/validators"

import useChildrenWithDiverseNeedsFundingCategory from "@/use/use-children-with-diverse-needs-funding-category"
import useSnack from "@/use/use-snack"

import CurrencyInput from "@/components/CurrencyInput.vue"
import HeaderActionsFormCard from "@/components/common/HeaderActionsFormCard.vue"
import NumberTextField from "@/components/common/NumberTextField.vue"

const props = defineProps<{
  childrenWithDiverseNeedsFundingCategoryId: number
}>()

const emit = defineEmits<{
  saved: [childrenWithDiverseNeedsFundingCategoryId: number]
}>()

const { childrenWithDiverseNeedsFundingCategoryId } = toRefs(props)
const { childrenWithDiverseNeedsFundingCategory, save } =
  useChildrenWithDiverseNeedsFundingCategory(childrenWithDiverseNeedsFundingCategoryId)

const form = useTemplateRef("form")

const isSaving = ref(false)

const snack = useSnack()

async function submit() {
  if (isSaving.value || form.value === null) return

  const { valid } = await form.value.validate()
  if (!valid) return

  isSaving.value = true
  try {
    const updatedChildrenWithDiverseNeedsFundingCategory = await save()

    snack.success("Diverse need category updated successfully!")
    emit("saved", updatedChildrenWithDiverseNeedsFundingCategory.id)
  } catch (error) {
    rethrowUnexpectedError(error)

    snack.error(`Failed to update diverse need category: ${error}`)
  } finally {
    isSaving.value = false
  }
}
</script>
