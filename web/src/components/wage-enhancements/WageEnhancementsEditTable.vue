<template>
  <v-table>
    <thead>
      <tr>
        <th></th>
        <th class="text-left">Per Employee</th>
        <th class="text-left">Est. Hours</th>
        <th class="text-left">Est. Total</th>
        <th class="text-left">Act. Hours</th>
        <th class="text-left">Act. Total</th>
        <th></th>
      </tr>
    </thead>
    <tbody v-if="isNil(props.fiscalPeriodId) || isLoadingEmployeeWageTiers">
      <tr>
        <td colspan="7"><v-skeleton-loader type="table-row" /></td>
      </tr>
    </tbody>
    <tbody v-else-if="isErroredEmployeeWageTiers">
      <tr>
        <td colspan="7">Unable to load wage tiers.</td>
      </tr>
    </tbody>
    <tbody v-else-if="isLoading">
      <tr>
        <td colspan="7"><v-skeleton-loader type="table-row" /></td>
      </tr>
    </tbody>
    <tbody v-else-if="isErrored">
      <tr>
        <td
          colspan="7"
          role="alert"
        >
          Unable to load wage enhancements. Reload the page to try again.
        </td>
      </tr>
    </tbody>
    <template v-else>
      <WageEnhancementTierTableBody
        v-for="employeeWageTier in employeeWageTiers"
        :key="employeeWageTier.id"
        :employee-wage-tier="employeeWageTier"
        :wage-enhancements="
          wageEnhancements.filter((record) => record.employeeWageTierId === employeeWageTier.id)
        "
        :is-creating="isCreating"
        :pending-ids="pendingIds"
        :errors-by-id="errorsById"
        @save="save"
        @create="create"
        @remove="remove"
      />
    </template>
    <tbody>
      <tr class="thin-solid-black-top-border">
        <td colspan="3"></td>
        <td>
          <v-text-field
            :model-value="formatMoney(wageEnhancementsEstimatedSubtotal)"
            aria-label="Wage Enhancement Total Estimated"
            color="primary"
            density="compact"
            tabindex="-1"
            variant="plain"
            hide-details
            readonly
          />
        </td>
        <td></td>
        <td>
          <v-text-field
            :model-value="formatMoney(wageEnhancementsActualSubtotal)"
            aria-label="Wage Enhancement Total Actual"
            color="primary"
            density="compact"
            tabindex="-1"
            variant="plain"
            hide-details
            readonly
          />
        </td>
        <td></td>
      </tr>
      <tr>
        <td>Plus {{ eiCppWcbRatePercentage }}%, EI, CPP, WCB</td>
        <td></td>
        <td>
          <v-text-field
            :model-value="`${eiCppWcbRatePercentage}%`"
            aria-label="EI CPP WCB Rate Percentage"
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
            :model-value="formatMoney(wageEnhancementsEstimatedEiCppWcbTotal)"
            aria-label="Wage Enhancement Estimated EI CPP WCB Total"
            color="primary"
            density="compact"
            tabindex="-1"
            variant="plain"
            hide-details
            readonly
          />
        </td>
        <td></td>
        <td>
          <v-text-field
            :model-value="formatMoney(wageEnhancementsActualEiCppWcbTotal)"
            aria-label="Wage Enhancement Actual EI CPP WCB Total"
            color="primary"
            density="compact"
            tabindex="-1"
            variant="plain"
            hide-details
            readonly
          />
        </td>
        <td></td>
      </tr>
      <tr class="thin-solid-black-top-border thicker-double-black-bottom-border">
        <td class="text-uppercase">Section Total</td>
        <td colspan="2"></td>
        <td>
          <v-text-field
            :model-value="formatMoney(wageEnhancementsEstimatedTotal)"
            aria-label="Wage Enhancement Estimated Total"
            color="primary"
            density="compact"
            tabindex="-1"
            variant="plain"
            hide-details
            readonly
          />
        </td>
        <td></td>
        <td>
          <v-text-field
            :model-value="formatMoney(wageEnhancementsActualTotal)"
            aria-label="Wage Enhancement Actual Total"
            color="primary"
            density="compact"
            tabindex="-1"
            variant="plain"
            hide-details
            readonly
          />
        </td>
        <td></td>
      </tr>
    </tbody>
  </v-table>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { isNil, keyBy, mapValues } from "lodash"
import Big from "big.js"

import { formatMoney } from "@/utils/formatters"

import useEmployeeWageTiers from "@/use/use-employee-wage-tiers"
import { EI_CPP_WCB_RATE } from "@/api/wage-enhancements-api"
import useWageEnhancementEditor from "@/use/use-wage-enhancement-editor"

import WageEnhancementTierTableBody from "@/components/wage-enhancements/WageEnhancementTierTableBody.vue"

const props = defineProps<{ centreId: number; fiscalPeriodId: number | undefined }>()
const employeeWageTiersQuery = computed(() => ({ where: { fiscalPeriodId: props.fiscalPeriodId } }))
const {
  employeeWageTiers,
  isLoading: isLoadingEmployeeWageTiers,
  isErrored: isErroredEmployeeWageTiers,
} = useEmployeeWageTiers(employeeWageTiersQuery, { skipWatchIf: () => isNil(props.fiscalPeriodId) })
const employeeWageTierIds = computed(() => employeeWageTiers.value.map(({ id }) => id))
const editingContext = computed(() => {
  if (
    isLoadingEmployeeWageTiers.value ||
    isErroredEmployeeWageTiers.value ||
    isNil(props.fiscalPeriodId)
  )
    return undefined

  return { centreId: props.centreId, employeeWageTierIds: employeeWageTierIds.value }
})
const {
  wageEnhancements,
  isLoading,
  isErrored,
  isCreating,
  pendingIds,
  errorsById,
  save,
  create,
  remove,
} = useWageEnhancementEditor(editingContext)
const wageRatePerHoursByEmployeeWageTierId = computed(() =>
  mapValues(keyBy(employeeWageTiers.value, "id"), "wageRatePerHour")
)
const wageEnhancementsEstimatedSubtotal = computed(() => {
  if (isNil(props.fiscalPeriodId) || isLoadingEmployeeWageTiers.value) return Big(0)
  return wageEnhancements.value.reduce((total, { hoursEstimated, employeeWageTierId }) => {
    const rate = wageRatePerHoursByEmployeeWageTierId.value[employeeWageTierId]
    if (isNil(rate)) return total
    return Big(total).add(Big(hoursEstimated).mul(Big(rate)))
  }, Big(0))
})
const wageEnhancementsActualSubtotal = computed(() => {
  if (isNil(props.fiscalPeriodId) || isLoadingEmployeeWageTiers.value) return Big(0)
  return wageEnhancements.value.reduce((total, { hoursActual, employeeWageTierId }) => {
    const rate = wageRatePerHoursByEmployeeWageTierId.value[employeeWageTierId]
    if (isNil(rate)) return total
    return Big(total).add(Big(hoursActual).mul(Big(rate)))
  }, Big(0))
})
const wageEnhancementsEstimatedEiCppWcbTotal = computed(() =>
  wageEnhancementsEstimatedSubtotal.value.mul(Big(EI_CPP_WCB_RATE))
)
const wageEnhancementsActualEiCppWcbTotal = computed(() =>
  wageEnhancementsActualSubtotal.value.mul(Big(EI_CPP_WCB_RATE))
)
const wageEnhancementsEstimatedTotal = computed(() =>
  wageEnhancementsEstimatedSubtotal.value.mul(Big("1").plus(Big(EI_CPP_WCB_RATE)))
)
const wageEnhancementsActualTotal = computed(() =>
  wageEnhancementsActualSubtotal.value.mul(Big("1").plus(Big(EI_CPP_WCB_RATE)))
)
const eiCppWcbRatePercentage = computed(() => Big(EI_CPP_WCB_RATE).mul(Big("100")).toFixed(2))
</script>

<style scoped>
.thin-solid-black-top-border > td {
  border-top: thin solid black;
}

.thicker-double-black-bottom-border > td {
  border-bottom: 3px double black;
}
</style>
