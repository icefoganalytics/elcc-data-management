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
      :items="qualityEnhancements"
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
          @focus="item.estimatedChildOccupancyRate = formatDecimal(item.estimatedChildOccupancyRate)"
      /></template>
      <template #item.actualChildOccupancyRate.edit="{ item }"
        ><v-text-field
          v-model="item.actualChildOccupancyRate"
          type="text"
          inputmode="decimal"
          :disabled="isReplicating || isSaving || isDeleting || isLoading || isErrored"
          hide-details
          @focus="item.actualChildOccupancyRate = formatDecimal(item.actualChildOccupancyRate)"
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
import { computed, ref, useTemplateRef } from "vue"
import { cloneDeep, keyBy, merge, pick } from "lodash"
import { formatDecimal, formatMoney } from "@/utils/formatters"
import sumByDecimal from "@/utils/sum-by-decimal"
import blockedToTrueConfirm from "@/utils/blocked-to-true-confirm"
import { MAX_PER_PAGE, type ModelOrder } from "@/api/base-api"
import qualityEnhancementsApi, {
  type QualityEnhancementAsIndex,
  type QualityEnhancementUpdateAttributes,
} from "@/api/quality-enhancements-api"
import rethrowUnexpectedError from "@/api/errors/rethrow-unexpected-error"
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
const qualityEnhancementsQuery = computed(() => ({
  where: props.where,
  order,
  perPage: MAX_PER_PAGE,
}))
const { qualityEnhancements, isLoading, isErrored, fetch } =
  useQualityEnhancements(qualityEnhancementsQuery)
const headers = [
  { title: "Category", key: "categoryId" },
  { title: "Subsidized", key: "monthlyAmount" },
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
  sumByDecimal(qualityEnhancements.value, "estimatedComputedTotal").toFixed(4)
)
const totalActual = computed(() =>
  sumByDecimal(qualityEnhancements.value, "actualComputedTotal").toFixed(4)
)
const totalEstimatedOccupancy = computed(() =>
  formatDecimal(sumByDecimal(qualityEnhancements.value, "estimatedChildOccupancyRate").toFixed(4))
)
const totalActualOccupancy = computed(() =>
  formatDecimal(sumByDecimal(qualityEnhancements.value, "actualChildOccupancyRate").toFixed(4))
)
const qualityEnhancementsById = computed(() => keyBy(qualityEnhancements.value, "id"))
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

function trackSave(qualityEnhancementRecord: QualityEnhancementAsIndex) {
  if (isSaving.value) return

  currentSave = saveIfDirty(qualityEnhancementRecord)
  return currentSave
}

async function commitEdit(): Promise<boolean> {
  editTable.value?.commitEdit()
  const pendingSave = currentSave
  try {
    const isSaved = (pendingSave === null || (await pendingSave)) && !isErrored.value
    if (!isSaved) editTable.value?.cancelPendingFocus()

    return isSaved
  } catch (error) {
    editTable.value?.cancelPendingFocus()
    rethrowUnexpectedError(error)

    return false
  } finally {
    if (currentSave === pendingSave) currentSave = null
  }
}

async function saveIfDirty(qualityEnhancementRecord: QualityEnhancementAsIndex) {
  const persistedQualityEnhancement = qualityEnhancementsById.value[qualityEnhancementRecord.id]
  if (
    !persistedQualityEnhancement ||
    props.isReplicating ||
    isSaving.value ||
    isDeleting.value ||
    isLoading.value ||
    isErrored.value
  )
    return false
  const changedOccupancyFields = editableColumns.filter(
    (field) =>
      formatDecimal(persistedQualityEnhancement[field]) !==
      formatDecimal(qualityEnhancementRecord[field])
  )
  if (!changedOccupancyFields.length) return true
  isSaving.value = true
  saveError.value = ""
  try {
    const { qualityEnhancement } = await qualityEnhancementsApi.update(
      qualityEnhancementRecord.id,
      pick(qualityEnhancementRecord, changedOccupancyFields)
    )
    const qualityEnhancementIndex = qualityEnhancements.value.findIndex(
      (existingQualityEnhancement) => existingQualityEnhancement.id === qualityEnhancementRecord.id
    )
    if (qualityEnhancementIndex >= 0)
      qualityEnhancements.value.splice(
        qualityEnhancementIndex,
        1,
        merge(cloneDeep(persistedQualityEnhancement), qualityEnhancement)
      )
    snack.success("Quality enhancement saved!")
    emit("updated")
    return true
  } catch (error) {
    rethrowUnexpectedError(error)

    saveError.value = `Failed to save quality enhancement: ${String(error)}. Retry your edit after reloading.`
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

async function deleteRecord(qualityEnhancementRecord: QualityEnhancementAsIndex) {
  if (
    !qualityEnhancementRecord.policy.destroy ||
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
  deletingId.value = qualityEnhancementRecord.id
  try {
    await qualityEnhancementsApi.delete(qualityEnhancementRecord.id)
    await refresh()
    snack.success("Quality enhancement deleted!")
    emit("updated")
  } catch (error) {
    rethrowUnexpectedError(error)

    snack.error(`Failed to delete quality enhancement: ${error}`)
  } finally {
    deletingId.value = null
    isDeleting.value = false
    emit("mutationSettled")
  }
}

async function refresh() {
  return fetch()
}

async function reload() {
  try {
    await refresh()
    saveError.value = ""
    currentSave = null
  } catch (error) {
    rethrowUnexpectedError(error)

    snack.error(`Failed to load Quality Enhancements: ${error}`)
  }
}

async function replicateEstimates() {
  if (isSaving.value || isDeleting.value || isLoading.value || isErrored.value) return
  isSaving.value = true
  const failures: unknown[] = []
  try {
    for (const qualityEnhancementRecord of qualityEnhancements.value) {
      try {
        await qualityEnhancementsApi.replicateEstimates(qualityEnhancementRecord.id)
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
  column: keyof QualityEnhancementUpdateAttributes
) {
  const occupancyColumnName = column === "estimatedChildOccupancyRate" ? "estimates" : "actuals"
  if (direction === "last") emit("focusBeyondLastInColumn", occupancyColumnName)
  else emit("focusBeyondFirstInColumn", occupancyColumnName)
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
  focusOnFirstInColumn,
  focusOnLastInColumn,
  isSaving,
  isDeleting,
  isLoading,
  isErrored,
  categoryIds,
})
</script>
