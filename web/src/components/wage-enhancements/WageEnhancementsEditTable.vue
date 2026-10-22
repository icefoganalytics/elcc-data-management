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
    <tbody
      v-if="isNil(props.fiscalPeriodId) || isLoadingEmployeeWageTiers || isLoadingWageEnhancements"
    >
      <tr>
        <td colspan="7"><v-skeleton-loader type="table-row" /></td>
      </tr>
    </tbody>
    <tbody v-else-if="isErroredEmployeeWageTiers">
      <tr>
        <td colspan="7">Unable to load wage tiers.</td>
      </tr>
    </tbody>
    <tbody v-else-if="isErroredWageEnhancements && wageEnhancements.length === 0">
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
      <tbody v-if="isErroredWageEnhancements">
        <tr>
          <td
            colspan="7"
            role="alert"
          >
            Unable to load wage enhancements. Reload the page to try again.
          </td>
        </tr>
      </tbody>
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
import { computed, onActivated, reactive, ref } from "vue"
import { isNil, keyBy, mapValues } from "lodash"
import Big from "big.js"

import { MAX_PER_PAGE } from "@/api/base-api"
import wageEnhancementsApi, {
  EI_CPP_WCB_RATE,
  type WageEnhancement,
} from "@/api/wage-enhancements-api"
import { formatMoney } from "@/utils/formatters"

import useEmployeeWageTiers from "@/use/use-employee-wage-tiers"
import useSnack from "@/use/use-snack"
import useWageEnhancements from "@/use/use-wage-enhancements"

import WageEnhancementTierTableBody from "@/components/wage-enhancements/WageEnhancementTierTableBody.vue"

type EditableAttributes = Pick<WageEnhancement, "employeeName" | "hoursEstimated" | "hoursActual">

function editableAttributes(wageEnhancement: WageEnhancement): EditableAttributes {
  return {
    employeeName: wageEnhancement.employeeName,
    hoursEstimated: wageEnhancement.hoursEstimated,
    hoursActual: wageEnhancement.hoursActual,
  }
}

const props = defineProps<{ centreId: number; fiscalPeriodId: number | undefined }>()
const employeeWageTiersQuery = computed(() => ({ where: { fiscalPeriodId: props.fiscalPeriodId } }))
const {
  employeeWageTiers,
  isLoading: isLoadingEmployeeWageTiers,
  isErrored: isErroredEmployeeWageTiers,
} = useEmployeeWageTiers(employeeWageTiersQuery, { skipWatchIf: () => isNil(props.fiscalPeriodId) })
const employeeWageTierIds = computed(() => employeeWageTiers.value.map(({ id }) => id))
const wageEnhancementsQuery = computed(() => ({
  where: {
    centreId: props.centreId,
    employeeWageTierId: employeeWageTierIds.value,
  },
  perPage: MAX_PER_PAGE,
}))
const {
  wageEnhancements,
  isLoading: isLoadingWageEnhancements,
  isErrored: isErroredWageEnhancements,
  refresh,
} = useWageEnhancements(wageEnhancementsQuery, {
  skipWatchIf: () =>
    isNil(props.fiscalPeriodId) ||
    isLoadingEmployeeWageTiers.value ||
    isErroredEmployeeWageTiers.value,
})

const pendingChanges = new Map<number, EditableAttributes>()
const activeWrites = new Map<number, Promise<void>>()
const pendingIds = reactive(new Set<number>())
const errorsById = reactive(new Map<number, string>())
const isCreating = ref(false)
const snack = useSnack()

onActivated(async () => {
  if (
    isLoadingEmployeeWageTiers.value ||
    isErroredEmployeeWageTiers.value ||
    isLoadingWageEnhancements.value ||
    isCreating.value ||
    pendingIds.size > 0 ||
    pendingChanges.size > 0 ||
    errorsById.size > 0
  )
    return

  await refresh()
})

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

function save(id: number): Promise<void> {
  const wageEnhancement = wageEnhancements.value.find((record) => record.id === id)
  if (!wageEnhancement) return Promise.resolve()

  pendingChanges.set(id, editableAttributes(wageEnhancement))
  const activeWrite = activeWrites.get(id)
  if (activeWrite) return activeWrite

  pendingIds.add(id)
  const write = persist(id).finally(() => {
    pendingIds.delete(id)
    activeWrites.delete(id)
  })
  activeWrites.set(id, write)
  return write
}

async function persist(id: number) {
  while (pendingChanges.has(id)) {
    const attributes = pendingChanges.get(id)
    pendingChanges.delete(id)
    if (!attributes) return

    try {
      await wageEnhancementsApi.update(id, attributes)
      errorsById.delete(id)
    } catch (error) {
      if (!pendingChanges.has(id)) pendingChanges.set(id, attributes)
      errorsById.set(id, String(error))
      console.error(`Failed to save wage enhancement: ${error}`, { error })
      snack.error(`Failed to save wage enhancement: ${error}`)
      return
    }
  }
}

async function create(employeeWageTierId: number) {
  const selectedCentreId = props.centreId
  if (isNil(props.fiscalPeriodId)) return

  isCreating.value = true
  try {
    const { wageEnhancement } = await wageEnhancementsApi.create({
      centreId: selectedCentreId,
      employeeWageTierId,
      employeeName: "",
      hoursEstimated: "0.0000",
      hoursActual: "0.0000",
    })
    if (!wageEnhancements.value.some(({ id }) => id === wageEnhancement.id)) {
      wageEnhancements.value.push(wageEnhancement)
    }
    snack.success("Wage enhancement created")
  } catch (error) {
    console.error(`Failed to create wage enhancement: ${error}`, { error })
    snack.error(`Failed to create wage enhancement: ${error}`)
  } finally {
    isCreating.value = false
  }
}

async function remove(id: number) {
  await activeWrites.get(id)
  pendingIds.add(id)
  try {
    await wageEnhancementsApi.delete(id)
    const index = wageEnhancements.value.findIndex((record) => record.id === id)
    if (index !== -1) wageEnhancements.value.splice(index, 1)
    pendingChanges.delete(id)
    errorsById.delete(id)
    snack.success("Wage enhancement deleted.")
  } catch (error) {
    console.error(`Failed to delete wage enhancement: ${error}`, { error })
    snack.error(`Failed to delete wage enhancement: ${error}`)
  } finally {
    pendingIds.delete(id)
  }
}
</script>

<style scoped>
.thin-solid-black-top-border > td {
  border-top: thin solid black;
}

.thicker-double-black-bottom-border > td {
  border-bottom: 3px double black;
}
</style>
