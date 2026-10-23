<template>
  <UniqueTextField
    ref="uniqueTextField"
    v-model="categoryName"
    :label="label"
    :check-availability="checkCategoryNameAvailability"
    :rules="rules"
    maxlength="200"
    unique-validation-message="Category name must be unique within its funding period"
    is-unique-message="Category name is available"
    is-not-unique-message="Category name is already taken in this funding period"
  />
</template>

<script setup lang="ts">
import { useTemplateRef } from "vue"
import { isNil } from "lodash"
import { type VTextField } from "vuetify/components"

import qualityEnhancementCategoriesApi from "@/api/quality-enhancement-categories-api"

import UniqueTextField from "@/components/common/UniqueTextField.vue"

const categoryName = defineModel<string | null | undefined>({
  required: true,
})

const props = withDefaults(
  defineProps<{
    fundingPeriodId: number | null | undefined
    excludingCategoryId?: number
    label?: string
    rules?: VTextField["rules"]
  }>(),
  {
    excludingCategoryId: undefined,
    label: "Category Name",
    rules: () => [],
  }
)

async function checkCategoryNameAvailability(name: string) {
  if (isNil(props.fundingPeriodId)) {
    return true
  }

  const { qualityEnhancementCategories } = await qualityEnhancementCategoriesApi.list({
    where: {
      fundingPeriodId: props.fundingPeriodId,
    },
    filters: {
      search: name,
    },
    perPage: -1,
  })

  return !qualityEnhancementCategories.some(
    (category) => category.categoryName === name && category.id !== props.excludingCategoryId
  )
}

const uniqueTextField = useTemplateRef("uniqueTextField")

defineExpose({
  validate: () => uniqueTextField.value?.validate(),
})
</script>
