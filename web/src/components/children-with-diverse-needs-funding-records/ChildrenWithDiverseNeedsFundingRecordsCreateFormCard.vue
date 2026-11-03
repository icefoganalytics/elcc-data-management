<template>
  <HeaderActionsFormCard
    ref="form"
    @submit.prevent="create"
  >
    <template #header><h4>Add Children with Diverse Needs</h4></template>
    <v-row>
      <v-col cols="12">
        <ChildrenWithDiverseNeedsFundingCategorySearchableAutocomplete
          v-model="attributes.categoryId"
          :funding-period-id="fundingPeriodId"
          :excluding-category-ids="existingCategoryIds"
          :disabled="isCreating || isWorkflowBusy"
          :rules="[required]"
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-text-field
          v-model="attributes.estimatedChildOccupancyRate"
          label="Estimated Occupancy"
          type="text"
          inputmode="decimal"
          :rules="[required, greaterThanOrEqualTo(0)]"
          :disabled="isCreating || isWorkflowBusy"
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-text-field
          v-model="attributes.actualChildOccupancyRate"
          label="Actual Occupancy"
          type="text"
          inputmode="decimal"
          :rules="[required, greaterThanOrEqualTo(0)]"
          :disabled="isCreating || isWorkflowBusy"
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-checkbox
          v-model="attributes.applyToCurrentAndFutureFiscalPeriods"
          color="primary"
          hide-details
          label="Apply to current and future fiscal periods for this centre"
          :disabled="isCreating || isWorkflowBusy"
        />
      </v-col>
    </v-row>
    <template #actions>
      <v-btn
        color="primary"
        type="submit"
        :loading="isCreating"
        :disabled="isWorkflowBusy"
        >Create</v-btn
      >
      <v-btn
        variant="text"
        color="warning"
        :disabled="isCreating || isWorkflowBusy"
        @click="emit('cancel')"
        >Cancel</v-btn
      >
    </template>
  </HeaderActionsFormCard>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from "vue"

import childrenWithDiverseNeedsFundingRecordsApi from "@/api/children-with-diverse-needs-funding-records-api"
import { greaterThanOrEqualTo, required } from "@/utils/validators"
import useSnack from "@/use/use-snack"
import ChildrenWithDiverseNeedsFundingCategorySearchableAutocomplete from "@/components/children-with-diverse-needs-funding-categories/ChildrenWithDiverseNeedsFundingCategorySearchableAutocomplete.vue"
import HeaderActionsFormCard from "@/components/common/HeaderActionsFormCard.vue"

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
const attributes = ref({
  categoryId: null as number | null,
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
    if (!valid || attributes.value.categoryId === null) return
    const { childrenWithDiverseNeedsFundingRecord } =
      await childrenWithDiverseNeedsFundingRecordsApi.create({
        centreId: props.centreId,
        fiscalPeriodId: props.fiscalPeriodId,
        categoryId: attributes.value.categoryId,
        estimatedChildOccupancyRate: attributes.value.estimatedChildOccupancyRate,
        actualChildOccupancyRate: attributes.value.actualChildOccupancyRate,
        applyToCurrentAndFutureFiscalPeriods: attributes.value.applyToCurrentAndFutureFiscalPeriods,
      })
    emit("created", childrenWithDiverseNeedsFundingRecord.id)
    snack.success("Diverse need created successfully")
  } catch (error) {
    snack.error(`Failed to create Children with Diverse Needs: ${error}`)
  } finally {
    isCreating.value = false
    emit("saving", false)
  }
}
</script>
