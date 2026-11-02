<template>
  <v-btn
    :loading="isReplicatingEstimates"
    color="yg-sun"
    size="small"
    @click="replicateEstimatesForward"
  >
    <v-icon start>mdi-content-copy</v-icon> Replicate Estimates
  </v-btn>
</template>

<script setup lang="ts">
import { ref } from "vue"

import { ApiOperationError } from "@/api/errors/api-operation-error"

import wageEnhancementsApi from "@/api/wage-enhancements-api"
import useSnack from "@/use/use-snack"

const props = defineProps<{
  centreId: number
  fiscalPeriodId: number
}>()

const isReplicatingEstimates = ref(false)
const snack = useSnack()

async function replicateEstimatesForward() {
  isReplicatingEstimates.value = true
  try {
    await wageEnhancementsApi.replicateEstimates({
      centreId: props.centreId,
      fiscalPeriodId: props.fiscalPeriodId,
    })
    snack.success("Wage enhancement estimates replicated forward.")
  } catch (error) {
    if (error instanceof ApiOperationError) {
      console.error(`Failed to replicate wage enhancement estimates: ${error}`, { error })
      snack.error(`Failed to replicate wage enhancement estimates: ${error}`)
      return
    }
    throw error
  } finally {
    isReplicatingEstimates.value = false
  }
}
</script>
