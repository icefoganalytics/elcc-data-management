<template>
  <tbody>
    <tr class="bg-grey-lighten-2">
      <td>{{ employeeWageTier.tierLabel }}</td>
      <td colspan="5"></td>
      <td class="d-flex justify-end align-center">
        <v-btn
          title="Add employee"
          icon="$plus"
          density="comfortable"
          color="yg-blue"
          :loading="isCreating"
          @click="emit('create', employeeWageTier.id)"
        />
      </td>
    </tr>
    <template
      v-for="wageEnhancement in wageEnhancements"
      :key="wageEnhancement.id"
    >
      <tr>
        <td>
          <v-text-field
            v-model="wageEnhancement.employeeName"
            aria-label="Employee Name"
            density="compact"
            variant="underlined"
            hide-details
            :disabled="deletingIds.has(wageEnhancement.id)"
            @blur="emit('save', wageEnhancement.id)"
            @keydown.enter.prevent="emit('save', wageEnhancement.id)"
          />
        </td>
        <td>
          <v-text-field
            :model-value="formatMoney(employeeWageTier.wageRatePerHour)"
            aria-label="Wage Rate Per Hour"
            color="primary"
            density="compact"
            tabindex="-1"
            variant="plain"
            hide-details
            readonly
          />
        </td>
        <td>
          <v-text-field
            v-model="wageEnhancement.hoursEstimated"
            aria-label="Hours Estimated"
            density="compact"
            variant="underlined"
            hide-details
            :disabled="deletingIds.has(wageEnhancement.id)"
            @blur="emit('save', wageEnhancement.id)"
            @keydown.enter.prevent="emit('save', wageEnhancement.id)"
          />
        </td>
        <td>
          <v-text-field
            :model-value="formatMoney(calculateTotal(wageEnhancement, 'hoursEstimated'))"
            aria-label="Wage Enhancement Total Estimated"
            color="primary"
            density="compact"
            tabindex="-1"
            variant="plain"
            hide-details
            readonly
          />
        </td>
        <td>
          <v-text-field
            v-model="wageEnhancement.hoursActual"
            aria-label="Hours Actual"
            density="compact"
            variant="underlined"
            hide-details
            :disabled="deletingIds.has(wageEnhancement.id)"
            @blur="emit('save', wageEnhancement.id)"
            @keydown.enter.prevent="emit('save', wageEnhancement.id)"
          />
        </td>
        <td>
          <v-text-field
            :model-value="formatMoney(calculateTotal(wageEnhancement, 'hoursActual'))"
            aria-label="Wage Enhancement Total Actual"
            color="primary"
            density="compact"
            tabindex="-1"
            variant="plain"
            hide-details
            readonly
          />
        </td>
        <td class="d-flex justify-end align-center">
          <v-btn
            icon="mdi-close"
            title="Delete"
            class="ml-2"
            color="error"
            density="comfortable"
            variant="text"
            :loading="deletingIds.has(wageEnhancement.id)"
            @click="emit('remove', wageEnhancement.id)"
          />
        </td>
      </tr>
      <tr
        v-if="errorsById.has(wageEnhancement.id)"
        class="text-error"
        role="alert"
      >
        <td colspan="7">
          Unable to save employee changes. {{ errorsById.get(wageEnhancement.id) }}
          <v-btn
            size="small"
            variant="text"
            aria-label="Retry saving employee"
            :loading="pendingIds.has(wageEnhancement.id)"
            :disabled="deletingIds.has(wageEnhancement.id)"
            @click="emit('retry', wageEnhancement.id)"
            >Retry</v-btn
          >
        </td>
      </tr>
    </template>
  </tbody>
</template>

<script setup lang="ts">
import Big from "big.js"

import { formatMoney } from "@/utils/formatters"
import type { EmployeeWageTierAsIndex } from "@/api/employee-wage-tiers-api"
import type { WageEnhancementAsIndex } from "@/api/wage-enhancements-api"

const props = defineProps<{
  employeeWageTier: EmployeeWageTierAsIndex
  wageEnhancements: WageEnhancementAsIndex[]
  isCreating: boolean
  pendingIds: Set<number>
  deletingIds: Set<number>
  errorsById: Map<number, string>
}>()
const emit = defineEmits<{
  save: [wageEnhancementId: number]
  retry: [wageEnhancementId: number]
  create: [employeeWageTierId: number]
  remove: [wageEnhancementId: number]
}>()

function calculateTotal(
  wageEnhancement: WageEnhancementAsIndex,
  field: "hoursEstimated" | "hoursActual"
): string {
  return Big(wageEnhancement[field] || "0")
    .mul(props.employeeWageTier.wageRatePerHour)
    .toFixed(4)
}
</script>
