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
        :disabled="isSaving || isDeleting"
        @click="reload"
        >Reload</v-btn
      >
    </v-alert>
    <v-alert
      v-if="isErrored"
      type="error"
      density="compact"
      role="alert"
      >Administration costs could not be loaded.
      <v-btn
        variant="text"
        @click="reload"
        >Retry</v-btn
      ></v-alert
    >
    <EditDataTableVirtual
      ref="editTable"
      :busy="isBusy"
      :headers="headers"
      :items="displayedCosts"
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
          :disabled="isReplicating || isSaving || isDeleting || isLoading || isErrored"
          hide-details
      /></template>
      <template #item.actualChildOccupancyRate.edit="{ item }"
        ><v-text-field
          v-model="item.actualChildOccupancyRate"
          type="text"
          inputmode="decimal"
          :disabled="isReplicating || isSaving || isDeleting || isLoading || isErrored"
          hide-details
      /></template>
      <template #item.actions="{ item }">
        <v-btn
          v-if="item.policy.destroy"
          color="error"
          variant="outlined"
          size="small"
          :loading="deletingId === item.id"
          :disabled="isReplicating || isSaving || isDeleting || isLoading || isErrored"
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
import Big from "big.js"
import { keyBy, pick } from "lodash"
import { formatDecimal, formatMoney } from "@/utils/formatters"
import sumByDecimal from "@/utils/sum-by-decimal"
import blockedToTrueConfirm from "@/utils/blocked-to-true-confirm"
import { MAX_PER_PAGE, type ModelOrder } from "@/api/base-api"
import type { FundingLineValue } from "@/api/funding-submission-line-jsons-api"
import administrationCostsApi, {
  type AdministrationCostAsIndex,
  type AdministrationCostOccupancyAttributes,
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
const order: ModelOrder[] = [
  ["childCareSpaceCategoryId", "ASC"],
  ["id", "ASC"],
]
const query = computed(() => ({ where: props.where, order, perPage: MAX_PER_PAGE }))
const { administrationCosts, isLoading, isErrored, fetch } = useAdministrationCosts(query)
const occupancyPreviews = ref<Record<number, Partial<AdministrationCostAsIndex>>>({})
const displayedCosts = computed(() =>
  administrationCosts.value.map((record) => {
    const displayed = { ...record, ...occupancyPreviews.value[record.id] }
    displayed.estimatedChildOccupancyRate = formatDecimal(displayed.estimatedChildOccupancyRate)
    displayed.actualChildOccupancyRate = formatDecimal(displayed.actualChildOccupancyRate)
    return displayed
  })
)
const headers = [
  { title: "Category", key: "categoryId" },
  { title: "Per Child", key: "monthlyAmount" },
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
  sumByDecimal(displayedCosts.value, "estimatedComputedTotal").toFixed(4)
)
const totalActual = computed(() =>
  sumByDecimal(displayedCosts.value, "actualComputedTotal").toFixed(4)
)
const totalEstimatedOccupancy = computed(() =>
  formatDecimal(sumByDecimal(displayedCosts.value, "estimatedChildOccupancyRate").toFixed(4))
)
const totalActualOccupancy = computed(() =>
  formatDecimal(sumByDecimal(displayedCosts.value, "actualChildOccupancyRate").toFixed(4))
)
const byId = computed(() => keyBy(administrationCosts.value, "id"))
const categoryIds = computed(() => administrationCosts.value.map(({ categoryId }) => categoryId))
const editTable = useTemplateRef<{
  commitEdit: () => void
  focusOnFirstInColumn: (column: keyof AdministrationCostOccupancyAttributes) => boolean
  focusOnLastInColumn: (column: keyof AdministrationCostOccupancyAttributes) => boolean
  cancelPendingFocus: () => void
}>("editTable")
let currentSave: Promise<boolean> | null = null
const isSaving = ref(false)
const isDeleting = ref(false)
const deletingId = ref<number | null>(null)
const saveError = ref("")
const isBusy = computed(
  () =>
    props.isReplicating || isSaving.value || isDeleting.value || isLoading.value || isErrored.value
)
const snack = useSnack()

function trackSave(record: AdministrationCostAsIndex) {
  if (isSaving.value) return

  currentSave = saveIfDirty(record)
  return currentSave
}

async function commitEdit(): Promise<boolean> {
  editTable.value?.commitEdit()
  const save = currentSave
  try {
    const saved = (save === null || (await save)) && !isErrored.value
    if (!saved) editTable.value?.cancelPendingFocus()
    return saved
  } catch (error) {
    editTable.value?.cancelPendingFocus()
    rethrowUnexpectedError(error)

    return false
  } finally {
    if (currentSave === save) currentSave = null
  }
}

async function saveIfDirty(record: AdministrationCostAsIndex) {
  const current = byId.value[record.id]
  if (
    !current ||
    props.isReplicating ||
    isSaving.value ||
    isDeleting.value ||
    isLoading.value ||
    isErrored.value
  )
    return false
  const changed = editableColumns.filter(
    (field) => formatDecimal(current[field]) !== formatDecimal(record[field])
  )
  if (!changed.length) return true
  isSaving.value = true
  saveError.value = ""
  try {
    const { administrationCost } = await administrationCostsApi.update(
      record.id,
      pick(record, changed)
    )
    const index = administrationCosts.value.findIndex((item) => item.id === record.id)
    if (index >= 0)
      administrationCosts.value.splice(index, 1, { ...current, ...administrationCost })
    delete occupancyPreviews.value[record.id]
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

async function deleteRecord(record: AdministrationCostAsIndex) {
  if (
    !record.policy.destroy ||
    props.isReplicating ||
    isSaving.value ||
    isDeleting.value ||
    isErrored.value ||
    isLoading.value ||
    !blockedToTrueConfirm("Are you sure you want to remove this administration cost?")
  )
    return

  if (!(await commitEdit())) return

  isDeleting.value = true
  deletingId.value = record.id
  try {
    await administrationCostsApi.delete(record.id)
    await refresh()
    snack.success("Administration cost deleted!")
    emit("updated")
  } catch (error) {
    rethrowUnexpectedError(error)

    snack.error(`Failed to delete administration cost: ${error}`)
  } finally {
    deletingId.value = null
    isDeleting.value = false
    emit("mutationSettled")
  }
}

async function refresh() {
  const records = await fetch()
  occupancyPreviews.value = {}
  return records
}

async function reload() {
  try {
    await refresh()
    saveError.value = ""
    currentSave = null
  } catch (error) {
    rethrowUnexpectedError(error)

    snack.error(`Failed to load administration costs: ${error}`)
  }
}

async function replicateEstimates() {
  if (isSaving.value || isDeleting.value || isLoading.value || isErrored.value) return
  isSaving.value = true
  const failures: unknown[] = []
  try {
    for (const record of administrationCosts.value) {
      try {
        await administrationCostsApi.replicateEstimates(record.id)
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

// Preview unsaved Spaces changes; the Spaces save owns their transactional propagation.
function previewSpaceOccupancy(line: FundingLineValue) {
  for (const record of administrationCosts.value) {
    if (record.childCareSpaceCategoryId !== line.submissionLineId) continue

    occupancyPreviews.value[record.id] = {
      estimatedChildOccupancyRate: line.estimatedChildOccupancyRate,
      actualChildOccupancyRate: line.actualChildOccupancyRate,
      estimatedComputedTotal: Big(record.monthlyAmount)
        .mul(line.estimatedChildOccupancyRate)
        .toFixed(4),
      actualComputedTotal: Big(record.monthlyAmount).mul(line.actualChildOccupancyRate).toFixed(4),
    }
  }
}
function emitBoundary(
  direction: "last" | "first",
  column: keyof AdministrationCostOccupancyAttributes
) {
  const name = column === "estimatedChildOccupancyRate" ? "estimates" : "actuals"
  if (direction === "last") emit("focusBeyondLastInColumn", name)
  else emit("focusBeyondFirstInColumn", name)
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
  previewSpaceOccupancy,
  focusOnFirstInColumn,
  focusOnLastInColumn,
  isSaving,
  isDeleting,
  isLoading,
  isErrored,
  categoryIds,
})
</script>
