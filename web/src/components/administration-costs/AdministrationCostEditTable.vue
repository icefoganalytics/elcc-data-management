<template>
  <div>
    <v-alert
      v-if="saveError"
      type="error"
      density="compact"
      role="alert"
    >
      {{ saveError }}
      <v-btn
        variant="text"
        :loading="isSaving || isDeleting"
        @click="reload"
        >Reload</v-btn
      >
    </v-alert>
    <EditDataTableVirtual
      ref="editTable"
      :busy="isBusy"
      :headers="headers"
      :items="administrationCosts"
      :loading="isLoading || isSaving || isDeleting"
      :editable-columns="editableColumns"
      fixed-footer
      disable-sort
      @update:cell="trackSave"
      @focus-beyond-last-in-column="emitBoundary('last', $event)"
      @focus-beyond-first-in-column="emitBoundary('first', $event)"
    >
      <template #item.categoryId="{ item }">{{ item.lineName }}</template>
      <template #item.monthlyAmount="{ item }">{{ formatMoney(item.monthlyAmount) }}</template>
      <template #item.estimatedChildOccupancyRate="{ item }">{{
        formatDecimal(item.estimatedChildOccupancyRate)
      }}</template>
      <template #item.estimatedComputedTotal="{ item }">{{
        formatMoney(item.estimatedComputedTotal)
      }}</template>
      <template #item.actualChildOccupancyRate="{ item }">{{
        formatDecimal(item.actualChildOccupancyRate)
      }}</template>
      <template #item.actualComputedTotal="{ item }">{{
        formatMoney(item.actualComputedTotal)
      }}</template>
      <template #item.estimatedChildOccupancyRate.edit="{ item }"
        ><v-text-field
          v-model="item.estimatedChildOccupancyRate"
          type="text"
          inputmode="decimal"
          :disabled="isReplicating || isSaving || isDeleting || isLoading"
          hide-details
          @focus="item.estimatedChildOccupancyRate = formatDecimal(item.estimatedChildOccupancyRate)"
      /></template>
      <template #item.actualChildOccupancyRate.edit="{ item }"
        ><v-text-field
          v-model="item.actualChildOccupancyRate"
          type="text"
          inputmode="decimal"
          :disabled="isReplicating || isSaving || isDeleting || isLoading"
          hide-details
          @focus="item.actualChildOccupancyRate = formatDecimal(item.actualChildOccupancyRate)"
      /></template>
      <template #item.actions="{ item }">
        <v-btn
          v-if="item.policy.destroy"
          color="error"
          variant="outlined"
          size="small"
          :loading="isBusy"
          @click.stop="deleteRecord(item)"
          >Delete</v-btn
        >
      </template>
      <template #tfoot>
        <tfoot>
          <tr class="bg-grey-lighten-3 font-weight-medium">
            <td>SECTION TOTAL</td>
            <td></td>
            <td>{{ totalEstimatedOccupancy }}</td>
            <td>{{ formatMoney(totalEstimated) }}</td>
            <td>{{ totalActualOccupancy }}</td>
            <td>{{ formatMoney(totalActual) }}</td>
            <td></td>
          </tr>
        </tfoot>
      </template>
    </EditDataTableVirtual>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef } from "vue"
import { cloneDeep, keyBy, merge, pick } from "lodash"
import { formatDecimal, formatMoney } from "@/utils/formatters"
import sumByDecimal from "@/utils/sum-by-decimal"
import blockedToTrueConfirm from "@/utils/blocked-to-true-confirm"
import { MAX_PER_PAGE } from "@/api/base-api"
import administrationCostsApi, {
  type AdministrationCostAsIndex,
  type AdministrationCostOccupancyAttributes,
  type AdministrationCostQueryOptions,
} from "@/api/administration-costs-api"
import rethrowUnexpectedError from "@/api/errors/rethrow-unexpected-error"
import useAdministrationCosts from "@/use/use-administration-costs"
import useSnack from "@/use/use-snack"
import EditDataTableVirtual from "@/components/common/EditDataTableVirtual.vue"

const props = withDefaults(
  defineProps<{
    where?: { centreId?: number; fiscalPeriodId?: number }
    isReplicating?: boolean
  }>(),
  { where: () => ({}), isReplicating: false }
)

const emit = defineEmits<{
  updated: []
  mutationSettled: []
  focusBeyondLastInColumn: [column: "estimates" | "actuals"]
  focusBeyondFirstInColumn: [column: "estimates" | "actuals"]
}>()

const administrationCostsQuery = computed<AdministrationCostQueryOptions>(() => ({
  where: props.where,
  order: [
    ["childCareSpaceCategoryId", "ASC"],
    ["id", "ASC"],
  ],
  perPage: MAX_PER_PAGE,
}))
const {
  administrationCosts,
  isLoading,
  fetch: refresh,
} = useAdministrationCosts(administrationCostsQuery)
const headers = [
  { title: "Category", key: "categoryId" },
  { title: "Subsidized", key: "monthlyAmount" },
  { title: "Est", key: "estimatedChildOccupancyRate" },
  { title: "Est Total", key: "estimatedComputedTotal" },
  { title: "Act", key: "actualChildOccupancyRate" },
  { title: "Act Total", key: "actualComputedTotal" },
  { title: "Actions", key: "actions", sortable: false },
]
const editableColumns: (keyof AdministrationCostOccupancyAttributes)[] = [
  "estimatedChildOccupancyRate",
  "actualChildOccupancyRate",
]
const totalEstimated = computed(() =>
  sumByDecimal(administrationCosts.value, "estimatedComputedTotal").toFixed(4)
)
const totalActual = computed(() =>
  sumByDecimal(administrationCosts.value, "actualComputedTotal").toFixed(4)
)
const totalEstimatedOccupancy = computed(() =>
  formatDecimal(sumByDecimal(administrationCosts.value, "estimatedChildOccupancyRate").toFixed(4))
)
const totalActualOccupancy = computed(() =>
  formatDecimal(sumByDecimal(administrationCosts.value, "actualChildOccupancyRate").toFixed(4))
)
const administrationCostsById = computed(() => keyBy(administrationCosts.value, "id"))
const categoryIds = computed(() => administrationCosts.value.map(({ categoryId }) => categoryId))
const editTable = useTemplateRef<{
  commitEdit: () => void
  focusOnFirstInColumn: (column: keyof AdministrationCostOccupancyAttributes) => boolean
  focusOnLastInColumn: (column: keyof AdministrationCostOccupancyAttributes) => boolean
  cancelPendingFocus: () => void
}>("editTable")
let savePromise: Promise<boolean> = Promise.resolve(true)
const isSaving = ref(false)
const isDeleting = ref(false)
const saveError = ref("")
const isBusy = computed(
  () => props.isReplicating || isSaving.value || isDeleting.value || isLoading.value
)
const snack = useSnack()

function trackSave(administrationCostRecord: AdministrationCostAsIndex) {
  if (isBusy.value) return

  savePromise = saveIfDirty(administrationCostRecord)
  return savePromise
}

async function commitEdit(): Promise<boolean> {
  editTable.value?.commitEdit()
  try {
    const isSaved = await savePromise
    if (!isSaved) editTable.value?.cancelPendingFocus()

    return isSaved
  } catch (error) {
    editTable.value?.cancelPendingFocus()
    rethrowUnexpectedError(error)

    return false
  }
}

async function saveIfDirty(administrationCostRecord: AdministrationCostAsIndex) {
  const persistedAdministrationCost = administrationCostsById.value[administrationCostRecord.id]
  if (!persistedAdministrationCost || isBusy.value) return false

  const changedOccupancyFields = editableColumns.filter(
    (field) =>
      formatDecimal(persistedAdministrationCost[field]) !==
      formatDecimal(administrationCostRecord[field])
  )
  if (!changedOccupancyFields.length) return true

  isSaving.value = true
  saveError.value = ""
  try {
    const { administrationCost } = await administrationCostsApi.update(
      administrationCostRecord.id,
      pick(administrationCostRecord, changedOccupancyFields)
    )
    const administrationCostIndex = administrationCosts.value.findIndex(
      (existingAdministrationCost) => existingAdministrationCost.id === administrationCostRecord.id
    )
    if (administrationCostIndex >= 0)
      administrationCosts.value.splice(
        administrationCostIndex,
        1,
        merge(cloneDeep(persistedAdministrationCost), administrationCost)
      )
    snack.success("Administration cost saved!")
    emit("updated")
    return true
  } catch (error) {
    rethrowUnexpectedError(error)

    saveError.value = `Failed to save administration cost: ${String(error)}. Retry your edit after reloading.`
    try {
      await refresh()
    } catch (error) {
      rethrowUnexpectedError(error)

      /* Preserve the save failure if reload also fails. */
    }
    editTable.value?.cancelPendingFocus()
    return false
  } finally {
    isSaving.value = false
    emit("mutationSettled")
  }
}

async function deleteRecord(administrationCostRecord: AdministrationCostAsIndex) {
  if (!administrationCostRecord.policy.destroy || isBusy.value) return
  if (!blockedToTrueConfirm("Are you sure you want to remove this administration cost?")) return

  if (!(await commitEdit())) return

  isDeleting.value = true
  try {
    await administrationCostsApi.delete(administrationCostRecord.id)
    await refresh()
    snack.success("Administration cost deleted!")
    emit("updated")
  } catch (error) {
    rethrowUnexpectedError(error)

    snack.error(`Failed to delete administration cost: ${error}`)
  } finally {
    isDeleting.value = false
    emit("mutationSettled")
  }
}

async function reload() {
  try {
    await refresh()
    saveError.value = ""
    savePromise = Promise.resolve(true)
  } catch (error) {
    rethrowUnexpectedError(error)

    snack.error(`Failed to load administration costs: ${error}`)
  }
}

async function replicateEstimates() {
  if (isSaving.value || isDeleting.value || isLoading.value) return
  isSaving.value = true
  const failures: unknown[] = []
  try {
    for (const administrationCostRecord of administrationCosts.value) {
      try {
        await administrationCostsApi.replicateEstimates(administrationCostRecord.id)
      } catch (error) {
        failures.push(error)
      }
    }
    try {
      await refresh()
    } catch (error) {
      failures.push(error)
    }
    if (failures.length) {
      const message = `Failed to replicate administration cost estimates: ${failures.map(String).join("; ")}`
      const aggregateError = new AggregateError(failures, message)
      rethrowUnexpectedError(aggregateError)
      snack.error(message)
      throw aggregateError
    }
  } finally {
    isSaving.value = false
    emit("mutationSettled")
  }
}

function emitBoundary(
  direction: "last" | "first",
  column: keyof AdministrationCostOccupancyAttributes
) {
  const occupancyColumnName = column === "estimatedChildOccupancyRate" ? "estimates" : "actuals"
  if (direction === "last") emit("focusBeyondLastInColumn", occupancyColumnName)
  else emit("focusBeyondFirstInColumn", occupancyColumnName)
}

function focusOnFirstInColumn(column: keyof AdministrationCostOccupancyAttributes): boolean {
  return editTable.value?.focusOnFirstInColumn(column) ?? false
}

function focusOnLastInColumn(column: keyof AdministrationCostOccupancyAttributes): boolean {
  return editTable.value?.focusOnLastInColumn(column) ?? false
}

defineExpose({
  refresh,
  replicateEstimates,
  commitEdit,
  focusOnFirstInColumn,
  focusOnLastInColumn,
  isSaving,
  isDeleting,
  isLoading,
  categoryIds,
})
</script>
