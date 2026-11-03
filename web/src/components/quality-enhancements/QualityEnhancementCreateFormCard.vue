<template>
  <HeaderActionsFormCard
    ref="form"
    @submit.prevent="create"
  >
    <template #header><h4>Add Quality Enhancement</h4></template>
    <v-row
      ><v-col cols="12"
        ><QualityEnhancementCategorySearchableAutocomplete
          v-model="attributes.categoryId"
          :funding-period-id="fundingPeriodId"
          :excluding-category-ids="existingCategoryIds"
          :disabled="isCreating || isWorkflowBusy"
          :rules="[required]" /></v-col
    ></v-row>
    <v-row
      ><v-col cols="12"
        ><v-text-field
          v-model="attributes.estimatedChildOccupancyRate"
          label="Estimated Occupancy"
          type="text"
          inputmode="decimal"
          :rules="[required, greaterThanOrEqualTo(0)]"
          :disabled="isCreating || isWorkflowBusy" /></v-col
    ></v-row>
    <v-row
      ><v-col cols="12"
        ><v-text-field
          v-model="attributes.actualChildOccupancyRate"
          label="Actual Occupancy"
          type="text"
          inputmode="decimal"
          :rules="[required, greaterThanOrEqualTo(0)]"
          :disabled="isCreating || isWorkflowBusy" /></v-col
    ></v-row>
    <v-row
      ><v-col cols="12"
        ><v-checkbox
          v-model="attributes.applyToCurrentAndFutureFiscalPeriods"
          color="primary"
          hide-details
          label="Apply to current and future fiscal periods for this centre"
          :disabled="isCreating || isWorkflowBusy" /></v-col
    ></v-row>
    <template #actions
      ><v-btn
        color="primary"
        type="submit"
        :loading="isCreating"
        :disabled="isWorkflowBusy"
        >Create</v-btn
      ><v-btn
        variant="text"
        color="warning"
        :disabled="isCreating || isWorkflowBusy"
        @click="emit('cancel')"
        >Cancel</v-btn
      ></template
    >
  </HeaderActionsFormCard>
</template>
<script setup lang="ts">
import { ref, useTemplateRef } from "vue"
import { greaterThanOrEqualTo, required } from "@/utils/validators"
import qualityEnhancementsApi, {
  type QualityEnhancementCreationAttributes,
} from "@/api/quality-enhancements-api"
import useSnack from "@/use/use-snack"
import HeaderActionsFormCard from "@/components/common/HeaderActionsFormCard.vue"
import QualityEnhancementCategorySearchableAutocomplete from "@/components/quality-enhancement-categories/QualityEnhancementCategorySearchableAutocomplete.vue"

const props = withDefaults(
  defineProps<{
    centreId: number
    fiscalPeriodId: number
    fundingPeriodId: number
    existingCategoryIds: number[]
    isWorkflowBusy?: boolean
  }>(),
  { isWorkflowBusy: false }
)
const emit = defineEmits<{ created: [id: number]; cancel: []; saving: [value: boolean] }>()
const attributes = ref<{
  categoryId: number | null | undefined
  estimatedChildOccupancyRate: string
  actualChildOccupancyRate: string
  applyToCurrentAndFutureFiscalPeriods: boolean
}>({
  categoryId: undefined,
  estimatedChildOccupancyRate: "0",
  actualChildOccupancyRate: "0",
  applyToCurrentAndFutureFiscalPeriods: false,
})
const isCreating = ref(false)
const form = useTemplateRef("form")
const snack = useSnack()

async function create() {
  if (!form.value || props.isWorkflowBusy || isCreating.value) return
  isCreating.value = true
  emit("saving", true)
  try {
    const { valid } = await form.value.validate()
    if (!valid || attributes.value.categoryId == null) return
    const { qualityEnhancement } = await qualityEnhancementsApi.create({
      centreId: props.centreId,
      fiscalPeriodId: props.fiscalPeriodId,
      categoryId: attributes.value.categoryId,
      estimatedChildOccupancyRate: attributes.value.estimatedChildOccupancyRate,
      actualChildOccupancyRate: attributes.value.actualChildOccupancyRate,
      applyToCurrentAndFutureFiscalPeriods: attributes.value.applyToCurrentAndFutureFiscalPeriods,
    } satisfies QualityEnhancementCreationAttributes)
    emit("created", qualityEnhancement.id)
    snack.success("Quality enhancement created successfully")
  } catch (error) {
    snack.error(`Failed to create quality enhancement: ${error}`)
  } finally {
    isCreating.value = false
    emit("saving", false)
  }
}
</script>
