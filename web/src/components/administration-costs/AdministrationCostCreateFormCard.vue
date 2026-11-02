<template>
  <HeaderActionsFormCard
    ref="form"
    @submit.prevent="create"
  >
    <template #header><h4>Add Administration Cost</h4></template>
    <v-row
      ><v-col cols="12"
        ><AdministrationCostCategorySearchableAutocomplete
          v-model="attributes.categoryId"
          :funding-period-id="fundingPeriodId"
          :excluding-category-ids="existingCategoryIds"
          :disabled="isCreating || workflowBusy"
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
          :disabled="isCreating || workflowBusy" /></v-col
    ></v-row>
    <v-row
      ><v-col cols="12"
        ><v-text-field
          v-model="attributes.actualChildOccupancyRate"
          label="Actual Occupancy"
          type="text"
          inputmode="decimal"
          :rules="[required, greaterThanOrEqualTo(0)]"
          :disabled="isCreating || workflowBusy" /></v-col
    ></v-row>
    <v-row
      ><v-col cols="12"
        ><v-checkbox
          v-model="attributes.applyToCurrentAndFutureFiscalPeriods"
          color="primary"
          hide-details
          label="Apply to current and future fiscal periods for this centre"
          :disabled="isCreating || workflowBusy" /></v-col
    ></v-row>
    <template #actions
      ><v-btn
        color="primary"
        type="submit"
        :loading="isCreating"
        :disabled="workflowBusy"
        >Create</v-btn
      ><v-btn
        variant="text"
        color="warning"
        :disabled="isCreating || workflowBusy"
        @click="emit('cancel')"
        >Cancel</v-btn
      ></template
    >
  </HeaderActionsFormCard>
</template>
<script setup lang="ts">
import { ref, useTemplateRef } from "vue"
import { greaterThanOrEqualTo, required } from "@/utils/validators"
import administrationCostsApi, {
  type AdministrationCostCreationAttributes,
} from "@/api/administration-costs-api"
import useSnack from "@/use/use-snack"
import HeaderActionsFormCard from "@/components/common/HeaderActionsFormCard.vue"
import AdministrationCostCategorySearchableAutocomplete from "@/components/administration-cost-categories/AdministrationCostCategorySearchableAutocomplete.vue"

const props = withDefaults(
  defineProps<{
    centreId: number
    fiscalPeriodId: number
    fundingPeriodId: number
    existingCategoryIds: number[]
    workflowBusy?: boolean
  }>(),
  { workflowBusy: false }
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
  if (!form.value || props.workflowBusy || isCreating.value) return
  isCreating.value = true
  emit("saving", true)
  try {
    const { valid } = await form.value.validate()
    if (!valid || attributes.value.categoryId == null) return
    const { administrationCost } = await administrationCostsApi.create({
      centreId: props.centreId,
      fiscalPeriodId: props.fiscalPeriodId,
      categoryId: attributes.value.categoryId,
      estimatedChildOccupancyRate: attributes.value.estimatedChildOccupancyRate,
      actualChildOccupancyRate: attributes.value.actualChildOccupancyRate,
      applyToCurrentAndFutureFiscalPeriods: attributes.value.applyToCurrentAndFutureFiscalPeriods,
    } satisfies AdministrationCostCreationAttributes)
    emit("created", administrationCost.id)
    snack.success("Administration cost created successfully")
  } catch (error) {
    snack.error(`Failed to create administration cost: ${error}`)
  } finally {
    isCreating.value = false
    emit("saving", false)
  }
}
</script>
