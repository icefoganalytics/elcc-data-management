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
import { useTemplateRef } from "vue"

import type { ChildrenWithDiverseNeedsFundingCategory } from "@/api/children-with-diverse-needs-funding-categories-api"
import { required } from "@/utils/validators"
import CurrencyInput from "@/components/CurrencyInput.vue"
import HeaderActionsFormCard from "@/components/common/HeaderActionsFormCard.vue"
import NumberTextField from "@/components/common/NumberTextField.vue"

const childrenWithDiverseNeedsFundingCategory = defineModel<ChildrenWithDiverseNeedsFundingCategory>("childrenWithDiverseNeedsFundingCategory", {
  required: true,
})

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
