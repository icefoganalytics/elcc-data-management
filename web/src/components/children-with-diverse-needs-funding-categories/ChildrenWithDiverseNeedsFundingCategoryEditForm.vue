<template>
  <HeaderActionsFormCard
    ref="form"
    title="Edit Children with Diverse Needs Category"
    @submit.prevent="submit"
  >
    <v-text-field
      :model-value="fundingPeriodDescription"
      label="Funding Period"
      readonly
    />
    <v-text-field
      v-model="childrenWithChildrenWithDiverseNeedsFundingRecordsCategory.categoryName"
      :disabled="isSaving"
      label="Category Name *"
      :rules="[required]"
    />
    <v-row>
      <v-col
        cols="12"
        md="6"
      >
        <NumberTextField
          v-model="childrenWithChildrenWithDiverseNeedsFundingRecordsCategory.fromAge"
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
          v-model="childrenWithChildrenWithDiverseNeedsFundingRecordsCategory.toAge"
          :disabled="isSaving"
          label="To Age"
          min="0"
          step="1"
        />
      </v-col>
    </v-row>
    <CurrencyInput
      v-model="childrenWithChildrenWithDiverseNeedsFundingRecordsCategory.monthlyAmount"
      :disabled="isSaving"
      label="Monthly Amount *"
      :rules="[required]"
    />
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
import { useTemplateRef } from "vue"

import type { ChildrenWithDiverseNeedsFundingCategory } from "@/api/children-with-diverse-needs-funding-categories-api"
import { required } from "@/utils/validators"
import CurrencyInput from "@/components/CurrencyInput.vue"
import HeaderActionsFormCard from "@/components/common/HeaderActionsFormCard.vue"
import NumberTextField from "@/components/common/NumberTextField.vue"

const childrenWithChildrenWithDiverseNeedsFundingRecordsCategory = defineModel<ChildrenWithDiverseNeedsFundingCategory>(
  "childrenWithChildrenWithDiverseNeedsFundingRecordsCategory",
  {
    required: true,
  }
)

defineProps<{
  fundingPeriodDescription: string
  isSaving: boolean
}>()
const emit = defineEmits<{
  save: []
  cancel: []
}>()
const form = useTemplateRef("form")

defineExpose({ form })

async function submit() {
  const { valid } = (await form.value?.validate()) ?? { valid: false }
  if (valid) emit("save")
}
</script>
