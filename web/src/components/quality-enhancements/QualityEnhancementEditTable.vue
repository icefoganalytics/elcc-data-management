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
      >Quality enhancements could not be loaded.
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
      :items="displayedEnhancements"
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
      <template #item.actions="{ item }"
        ><v-btn
          v-if="item.policy.destroy"
          color="error"
          variant="outlined"
          size="small"
          :loading="deletingId === item.id"
          :disabled="isReplicating || isSaving || isDeleting || isLoading || isErrored"
          @click.stop="deleteRecord(item)"
          >Delete</v-btn
        ></template
      >
      <template #tfoot
        ><tfoot>
          <tr class="bg-grey-lighten-3 font-weight-medium">
            <td>SECTION TOTAL</td>
            <td></td>
            <td>{{ totalEstimatedOccupancy }}</td>
            <td>{{ formatMoney(totalEstimated) }}</td>
            <td>{{ totalActualOccupancy }}</td>
            <td>{{ formatMoney(totalActual) }}</td>
            <td></td>
          </tr></tfoot
      ></template>
    </EditDataTableVirtual>
  </div>
</template>

<script setup lang="ts">
import Big from "big.js"
import { computed, ref, useTemplateRef } from "vue"
import { keyBy, pick } from "lodash"
import { formatDecimal, formatMoney } from "@/utils/formatters"
import sumByDecimal from "@/utils/sum-by-decimal"
import blockedToTrueConfirm from "@/utils/blocked-to-true-confirm"
import { MAX_PER_PAGE, type ModelOrder } from "@/api/base-api"
import type { FundingLineValue } from "@/api/funding-submission-line-jsons-api"
import qualityEnhancementsApi, {
  type QualityEnhancementAsIndex,
  type QualityEnhancementUpdateAttributes,
} from "@/api/quality-enhancements-api"
import useQualityEnhancements from "@/use/use-quality-enhancements"
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
const { qualityEnhancements, isLoading, isErrored, fetch } = useQualityEnhancements(query)
const occupancyPreviews = ref<Record<number, Partial<QualityEnhancementAsIndex>>>({})
const displayedEnhancements = computed(() =>
  qualityEnhancements.value.map((record) => {
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
const editableColumns: (keyof QualityEnhancementUpdateAttributes)[] = [
  "estimatedChildOccupancyRate",
  "actualChildOccupancyRate",
]
const totalEstimated = computed(() =>
  sumByDecimal(displayedEnhancements.value, "estimatedComputedTotal").toFixed(4)
)
const totalActual = computed(() =>
  sumByDecimal(displayedEnhancements.value, "actualComputedTotal").toFixed(4)
)
const totalEstimatedOccupancy = computed(() =>
  formatDecimal(sumByDecimal(displayedEnhancements.value, "estimatedChildOccupancyRate").toFixed(4))
)
const totalActualOccupancy = computed(() =>
  formatDecimal(sumByDecimal(displayedEnhancements.value, "actualChildOccupancyRate").toFixed(4))
)
const byId = computed(() => keyBy(qualityEnhancements.value, "id"))
const categoryIds = computed(() => qualityEnhancements.value.map(({ categoryId }) => categoryId))
const editTable = useTemplateRef<{
  commitEdit: () => void
  focusOnFirstInColumn: (column: keyof QualityEnhancementUpdateAttributes) => boolean
  focusOnLastInColumn: (column: keyof QualityEnhancementUpdateAttributes) => boolean
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

function trackSave(record: QualityEnhancementAsIndex) {
  if (isSaving.value) return

  currentSave = saveIfDirty(record)
}

async function commitEdit(): Promise<boolean> {
  editTable.value?.commitEdit()
  const save = currentSave
  try {
    const saved = (save === null || (await save)) && !isErrored.value
    if (!saved) editTable.value?.cancelPendingFocus()
    return saved
  } catch {
    editTable.value?.cancelPendingFocus()
    return false
  } finally {
    if (currentSave === save) currentSave = null
  }
}

async function saveIfDirty(record: QualityEnhancementAsIndex) {
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
    const { qualityEnhancement } = await qualityEnhancementsApi.update(
      record.id,
      pick(record, changed)
    )
    const index = qualityEnhancements.value.findIndex((item) => item.id === record.id)
    if (index >= 0)
      qualityEnhancements.value.splice(index, 1, { ...current, ...qualityEnhancement })
    delete occupancyPreviews.value[record.id]
    snack.success("Quality enhancement saved!")
    emit("updated")
    return true
  } catch (error) {
    saveError.value = `Failed to save quality enhancement: ${String(error)}. Retry your edit after reloading.`
    try {
      await refresh()
    } catch {
      /* Preserve the save failure if reload also fails. */
    }
    editTable.value?.cancelPendingFocus()
    return false
  } finally {
    isSaving.value = false
    emit("mutationSettled")
  }
}

async function deleteRecord(record: QualityEnhancementAsIndex) {
  if (
    !record.policy.destroy ||
    props.isReplicating ||
    isSaving.value ||
    isDeleting.value ||
    isLoading.value ||
    isErrored.value ||
    !blockedToTrueConfirm("Are you sure you want to remove this quality enhancement?")
  )
    return

  if (!(await commitEdit())) return

  isDeleting.value = true
  deletingId.value = record.id
  try {
    await qualityEnhancementsApi.delete(record.id)
    await refresh()
    snack.success("Quality enhancement deleted!")
    emit("updated")
  } catch (error) {
    snack.error(`Failed to delete quality enhancement: ${error}`)
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
    snack.error(`Failed to load Quality Enhancements: ${error}`)
  }
}

async function replicateEstimates() {
  if (isSaving.value || isDeleting.value || isLoading.value || isErrored.value) return
  isSaving.value = true
  const failures: unknown[] = []
  try {
    for (const record of qualityEnhancements.value) {
      try {
        await qualityEnhancementsApi.replicateEstimates(record.id)
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
      const message = `Failed to replicate quality enhancement estimates: ${failures.map(String).join("; ")}`
      snack.error(message)
      throw new AggregateError(failures, message)
    }
  } finally {
    isSaving.value = false
    emit("mutationSettled")
  }
}

// Preview unsaved Spaces changes; the Spaces save owns their transactional propagation.
function previewSpaceOccupancy(line: FundingLineValue) {
  for (const record of qualityEnhancements.value) {
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
  column: keyof QualityEnhancementUpdateAttributes
) {
  const name = column === "estimatedChildOccupancyRate" ? "estimates" : "actuals"
  if (direction === "last") emit("focusBeyondLastInColumn", name)
  else emit("focusBeyondFirstInColumn", name)
}

function focusOnFirstInColumn(column: keyof QualityEnhancementUpdateAttributes): boolean {
  return editTable.value?.focusOnFirstInColumn(column) ?? false
}

function focusOnLastInColumn(column: keyof QualityEnhancementUpdateAttributes): boolean {
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
