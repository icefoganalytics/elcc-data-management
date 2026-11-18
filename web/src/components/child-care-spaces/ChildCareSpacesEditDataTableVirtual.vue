<template>
  <EditDataTableVirtual
    ref="editDataTableVirtual"
    :busy="isBusy"
    :headers="headers"
    :items="childCareSpaces"
    :loading="isLoading || isSaving"
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
    <template #item.estimatedChildOccupancyRate.edit="{ item }">
      <v-text-field
        v-model="item.estimatedChildOccupancyRate"
        type="text"
        inputmode="decimal"
        :disabled="isBusy"
        hide-details
        @focus="item.estimatedChildOccupancyRate = formatDecimal(item.estimatedChildOccupancyRate)"
      />
    </template>
    <template #item.actualChildOccupancyRate.edit="{ item }">
      <v-text-field
        v-model="item.actualChildOccupancyRate"
        type="text"
        inputmode="decimal"
        :disabled="isBusy"
        hide-details
        @focus="item.actualChildOccupancyRate = formatDecimal(item.actualChildOccupancyRate)"
      />
    </template>
    <template #tfoot>
      <tfoot>
        <tr class="bg-grey-lighten-3 font-weight-medium">
          <td>SECTION TOTAL</td>
          <td></td>
          <td>{{ formatDecimal(summaries.totalEstimatedOccupancy) }}</td>
          <td>{{ formatMoney(summaries.totalEstimated) }}</td>
          <td>{{ formatDecimal(summaries.totalActualOccupancy) }}</td>
          <td>{{ formatMoney(summaries.totalActual) }}</td>
        </tr>
      </tfoot>
    </template>
  </EditDataTableVirtual>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef } from "vue"
import { keyBy, pick } from "lodash"

import { MAX_PER_PAGE } from "@/api/base-api"
import childCareSpacesApi, {
  type ChildCareSpaceAsIndex,
  type ChildCareSpaceFiltersOptions,
  type ChildCareSpaceQueryOptions,
  type ChildCareSpaceWhereOptions,
  type ChildCareSpaceUpdateAttributes,
} from "@/api/child-care-spaces-api"
import rethrowUnexpectedError from "@/api/errors/rethrow-unexpected-error"

import useChildCareSpaces from "@/use/use-child-care-spaces"
import useSnack from "@/use/use-snack"

import { formatDecimal, formatMoney } from "@/utils/formatters"

import EditDataTableVirtual from "@/components/common/EditDataTableVirtual.vue"

const props = withDefaults(
  defineProps<{
    where?: ChildCareSpaceWhereOptions
    filters?: ChildCareSpaceFiltersOptions
    isReplicating?: boolean
  }>(),
  {
    where: () => ({}),
    filters: () => ({}),
    isReplicating: false,
  }
)

const emit = defineEmits<{
  updated: []
  mutationSettled: []
  focusBeyondLastInColumn: [column: "estimates" | "actuals"]
  focusBeyondFirstInColumn: [column: "estimates" | "actuals"]
}>()

const childCareSpacesQuery = computed<ChildCareSpaceQueryOptions>(() => ({
  where: props.where,
  filters: props.filters,
  perPage: MAX_PER_PAGE,
}))

const { childCareSpaces, summaries, isLoading, refresh } = useChildCareSpaces(childCareSpacesQuery)

const headers = ref([
  {
    title: "Category",
    key: "categoryId",
  },
  {
    title: "Per Child",
    key: "monthlyAmount",
  },
  {
    title: "Est",
    key: "estimatedChildOccupancyRate",
  },
  {
    title: "Est Total",
    key: "estimatedComputedTotal",
  },
  {
    title: "Act",
    key: "actualChildOccupancyRate",
  },
  {
    title: "Act Total",
    key: "actualComputedTotal",
  },
])

const editableColumns: (keyof ChildCareSpaceUpdateAttributes)[] = [
  "estimatedChildOccupancyRate",
  "actualChildOccupancyRate",
]

const childCareSpacesById = computed(() => keyBy(childCareSpaces.value, "id"))
const editDataTableVirtual = useTemplateRef("editDataTableVirtual")

let currentSave: Promise<boolean> | null = null
const isSaving = ref(false)
const isBusy = computed(() => props.isReplicating || isSaving.value || isLoading.value)
const snack = useSnack()

function trackSave(childCareSpace: ChildCareSpaceAsIndex) {
  if (isSaving.value) return

  currentSave = saveIfDirty(childCareSpace)
  return currentSave
}

async function commitEdit(): Promise<boolean> {
  editDataTableVirtual.value?.commitEdit()
  const save = currentSave
  try {
    const saved = save === null || (await save)
    if (!saved) editDataTableVirtual.value?.cancelPendingFocus()

    return saved
  } catch (error) {
    editDataTableVirtual.value?.cancelPendingFocus()
    console.error("Failed to commit child care space edit", { error })
    rethrowUnexpectedError(error)

    return false
  } finally {
    if (currentSave === save) currentSave = null
  }
}

async function saveIfDirty(childCareSpace: ChildCareSpaceAsIndex): Promise<boolean> {
  const currentChildCareSpace = childCareSpacesById.value[childCareSpace.id]
  if (!currentChildCareSpace || isBusy.value) return false

  const changedFields = editableColumns.filter(
    (field) => formatDecimal(currentChildCareSpace[field]) !== formatDecimal(childCareSpace[field])
  )
  if (!changedFields.length) return true

  isSaving.value = true
  try {
    try {
      const { childCareSpace: savedChildCareSpace, policy } = await childCareSpacesApi.update(
        childCareSpace.id,
        pick(childCareSpace, changedFields)
      )
      const index = childCareSpaces.value.findIndex(({ id }) => id === childCareSpace.id)
      if (index >= 0) {
        childCareSpaces.value.splice(index, 1, { ...savedChildCareSpace, policy })
      }
    } catch (error) {
      editDataTableVirtual.value?.cancelPendingFocus()
      console.error("Failed to save child care space", { error })
      rethrowUnexpectedError(error)

      snack.error(`Failed to save child care space: ${error}`)
      return false
    }

    emit("updated")
    return await refreshAfterSave()
  } finally {
    isSaving.value = false
    emit("mutationSettled")
  }
}

async function refreshAfterSave(): Promise<boolean> {
  try {
    await refresh()
    return true
  } catch (error) {
    editDataTableVirtual.value?.cancelPendingFocus()
    console.error("Child care spaces saved but worksheet summaries could not be refreshed", {
      error,
    })
    rethrowUnexpectedError(error)

    snack.error("Child care spaces were saved, but their summaries could not be refreshed.")
    return false
  }
}

async function replicateEstimates() {
  if (isSaving.value || isLoading.value) return

  isSaving.value = true
  const failures: unknown[] = []
  let hasReplicated = false
  try {
    for (const childCareSpace of childCareSpaces.value) {
      try {
        await childCareSpacesApi.replicateEstimates(childCareSpace.id)
        hasReplicated = true
      } catch (error) {
        failures.push(error)
      }
    }
    if (hasReplicated) emit("updated")
    const refreshed = await refreshAfterSave()
    if (failures.length) {
      const message = `Failed to replicate child care space estimates: ${failures.map(String).join("; ")}`
      const aggregateError = new AggregateError(failures, message)
      console.error("Failed to replicate child care space estimates", { error: aggregateError })
      rethrowUnexpectedError(aggregateError)

      snack.error(message)
      throw aggregateError
    }
    return refreshed
  } finally {
    isSaving.value = false
    emit("mutationSettled")
  }
}

function emitBoundary(direction: "last" | "first", column: keyof ChildCareSpaceUpdateAttributes) {
  const name = column === "estimatedChildOccupancyRate" ? "estimates" : "actuals"
  if (direction === "last") emit("focusBeyondLastInColumn", name)
  else emit("focusBeyondFirstInColumn", name)
}

function focusOnFirstInColumn(column: keyof ChildCareSpaceUpdateAttributes): boolean {
  return editDataTableVirtual.value?.focusOnFirstInColumn(column) ?? false
}

function focusOnLastInColumn(column: keyof ChildCareSpaceUpdateAttributes): boolean {
  return editDataTableVirtual.value?.focusOnLastInColumn(column) ?? false
}

defineExpose({
  commitEdit,
  refresh,
  replicateEstimates,
  focusOnFirstInColumn,
  focusOnLastInColumn,
  isSaving,
  isLoading,
})
</script>
