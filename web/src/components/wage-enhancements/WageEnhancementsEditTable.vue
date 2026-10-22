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
import { computed, reactive, ref, watch } from "vue"
import { isEqual, isNil, keyBy, mapValues } from "lodash"
import Big from "big.js"

import { MAX_PER_PAGE } from "@/api/base-api"
import wageEnhancementsApi, {
  EI_CPP_WCB_RATE,
  type WageEnhancement,
  type WageEnhancementAsIndex,
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
  wageEnhancements: fetchedWageEnhancements,
  isLoading: isLoadingWageEnhancements,
  isErrored: isErroredWageEnhancements,
} = useWageEnhancements(wageEnhancementsQuery, {
  skipWatchIf: () =>
    isNil(props.fiscalPeriodId) ||
    isLoadingEmployeeWageTiers.value ||
    isErroredEmployeeWageTiers.value,
})

const records = reactive(new Map<number, WageEnhancementAsIndex>())
const persistedAttributes = new Map<number, EditableAttributes>()
const pendingChanges = new Map<number, EditableAttributes>()
const activeWrites = new Map<number, Promise<void>>()
const visibleIds = ref<number[]>([])
const pendingIds = reactive(new Set<number>())
const errorsById = reactive(new Map<number, string>())
const isCreating = ref(false)
const snack = useSnack()
const wageEnhancements = computed(() => {
  const visibleRecords: WageEnhancementAsIndex[] = []
  for (const id of visibleIds.value) {
    const record = records.get(id)
    if (record) visibleRecords.push(record)
  }
  return visibleRecords
})
let baselineAtLoad = new Map<number, EditableAttributes>()

watch([() => props.fiscalPeriodId, () => props.centreId, employeeWageTierIds], () => {
  baselineAtLoad = new Map(persistedAttributes)
  visibleIds.value = []
})

watch(
  [fetchedWageEnhancements, isLoadingWageEnhancements, isErroredWageEnhancements],
  ([incomingRecords, loading, errored]) => {
    if (
      isNil(props.fiscalPeriodId) ||
      isLoadingEmployeeWageTiers.value ||
      isErroredEmployeeWageTiers.value
    ) {
      visibleIds.value = []
      return
    }
    if (loading) return
    if (errored) {
      visibleIds.value = [...records.values()]
        .filter(
          (record) =>
            record.centreId === props.centreId &&
            employeeWageTierIds.value.includes(record.employeeWageTierId)
        )
        .map(({ id }) => id)
      return
    }

    for (const incoming of incomingRecords) {
      const record = records.get(incoming.id)
      const baseline = persistedAttributes.get(incoming.id)
      const hasLocalChanges = record && !isEqual(editableAttributes(record), baseline)
      const wasSavedDuringLoad = baseline !== baselineAtLoad.get(incoming.id)
      if (hasLocalChanges || activeWrites.has(incoming.id) || wasSavedDuringLoad) continue

      records.set(incoming.id, { ...incoming })
      persistedAttributes.set(incoming.id, editableAttributes(incoming))
    }
    visibleIds.value = incomingRecords.map(({ id }) => id)
  },
  { immediate: true, deep: true }
)

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
  const record = records.get(id)
  if (!record) return Promise.resolve()

  pendingChanges.set(id, editableAttributes(record))
  const activeWrite = activeWrites.get(id)
  if (activeWrite) return activeWrite

  if (isEqual(pendingChanges.get(id), persistedAttributes.get(id))) {
    pendingChanges.delete(id)
    errorsById.delete(id)
    return Promise.resolve()
  }

  pendingIds.add(id)
  const write = persist(id).finally(() => {
    pendingIds.delete(id)
    activeWrites.delete(id)
  })
  activeWrites.set(id, write)
  return write
}

async function persist(id: number) {
  try {
    while (!isEqual(pendingChanges.get(id), persistedAttributes.get(id))) {
      const attributes = pendingChanges.get(id)
      if (!attributes) return

      await wageEnhancementsApi.update(id, attributes)
      persistedAttributes.set(id, attributes)
    }
    pendingChanges.delete(id)
    errorsById.delete(id)
  } catch (error) {
    errorsById.set(id, String(error))
    console.error(`Failed to save wage enhancement: ${error}`, { error })
    snack.error(`Failed to save wage enhancement: ${error}`)
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
    if (!records.has(wageEnhancement.id)) {
      records.set(wageEnhancement.id, { ...wageEnhancement })
      persistedAttributes.set(wageEnhancement.id, editableAttributes(wageEnhancement))
    }
    if (
      props.centreId === selectedCentreId &&
      employeeWageTierIds.value.includes(employeeWageTierId) &&
      !visibleIds.value.includes(wageEnhancement.id)
    ) {
      visibleIds.value.push(wageEnhancement.id)
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
    records.delete(id)
    persistedAttributes.delete(id)
    pendingChanges.delete(id)
    errorsById.delete(id)
    visibleIds.value = visibleIds.value.filter((visibleId) => visibleId !== id)
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
