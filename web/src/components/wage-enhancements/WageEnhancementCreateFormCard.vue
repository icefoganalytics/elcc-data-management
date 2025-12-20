<template>
  <HeaderActionsFormCard
    ref="headerActionsFormCard"
    @submit.prevent="createWageEnhancement"
  >
    <template #header>
      <h4>Add Employee</h4>
    </template>

    <v-row>
      <v-col cols="12">
        <v-select
          v-model="wageEnhancementAttributes.employeeWageTierId"
          :items="employeeWageTiers"
          :loading="isLoadingEmployeeWageTiers"
          item-title="tierLabel"
          item-value="id"
          label="Tier"
          :rules="[required]"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-text-field
          v-model="wageEnhancementAttributes.employeeName"
          label="Employee Name"
          :rules="[required]"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col
        cols="12"
        md="6"
      >
        <v-text-field
          v-model="wageEnhancementAttributes.hoursEstimated"
          label="Estimated Hours"
          type="number"
          :rules="[required]"
        />
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <v-text-field
          v-model="wageEnhancementAttributes.hoursActual"
          label="Actual Hours"
          type="number"
          :rules="[required]"
        />
      </v-col>
    </v-row>

    <template #actions>
      <v-btn
        color="primary"
        type="submit"
        :loading="isCreating"
      >
        Create
      </v-btn>
      <v-btn
        variant="text"
        color="warning"
        @click="emit('cancel')"
      >
        Cancel
      </v-btn>
    </template>
  </HeaderActionsFormCard>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef } from "vue"

import { required } from "@/utils/validators"

import wageEnhancementsApi, { type WageEnhancement } from "@/api/wage-enhancements-api"
import useEmployeeWageTiers from "@/use/use-employee-wage-tiers"
import useSnack from "@/use/use-snack"

import HeaderActionsFormCard from "@/components/common/HeaderActionsFormCard.vue"

const props = defineProps<{
  centreId: number
  fiscalPeriodId: number
}>()

const emit = defineEmits<{
  created: [wageEnhancementId: number]
  cancel: [void]
}>()

const employeeWageTiersQuery = computed(() => ({
  where: {
    fiscalPeriodId: props.fiscalPeriodId,
  },
}))
const { employeeWageTiers, isLoading: isLoadingEmployeeWageTiers } =
  useEmployeeWageTiers(employeeWageTiersQuery)

const wageEnhancementAttributes = ref<Partial<WageEnhancement>>({
  centreId: props.centreId,
  employeeWageTierId: undefined,
  employeeName: "",
  hoursEstimated: "0",
  hoursActual: "0",
})

const isCreating = ref(false)
const snack = useSnack()
const headerActionsFormCard = useTemplateRef("headerActionsFormCard")

async function createWageEnhancement() {
  if (headerActionsFormCard.value === null) return

  const { valid } = await headerActionsFormCard.value.validate()
  if (!valid) return

  isCreating.value = true
  try {
    const { wageEnhancement } = await wageEnhancementsApi.create(wageEnhancementAttributes.value)
    emit("created", wageEnhancement.id)
    snack.success("Wage enhancement created")
  } catch (error) {
    console.error(`Failed to create wage enhancement: ${error}`, { error })
    snack.error(`Failed to create wage enhancement: ${error}`)
  } finally {
    isCreating.value = false
  }
}
</script>
