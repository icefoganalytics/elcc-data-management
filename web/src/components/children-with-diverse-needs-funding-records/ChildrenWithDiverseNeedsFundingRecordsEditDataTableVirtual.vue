<template>
  <EditDataTableVirtual
    ref="editDataTableVirtual"
    :busy="isBusy"
    :headers="headers"
    :items="childrenWithDiverseNeedsFundingRecords"
    :loading="isLoading || isSaving || isDeleting"
    :editable-columns="editableColumns"
    :hide-default-body="isErrored"
    fixed-footer
    disable-sort
    @update:cell="trackSave"
  >
    <template #top>
      <v-alert
        v-if="saveError"
        type="error"
        density="compact"
        role="alert"
      >
        {{ saveError }}
        <v-btn
          variant="text"
          :disabled="isBusy"
          @click="reload"
          >Reload</v-btn
        >
      </v-alert>
      <v-alert
        v-if="isErrored"
        type="error"
        density="compact"
        role="alert"
      >
        Diverse needs could not be loaded.
        <v-btn
          variant="text"
          :disabled="isBusy"
          @click="reload"
          >Retry</v-btn
        >
      </v-alert>
    </template>
    <template #item.categoryId="{ item }">{{ item.lineName }}</template>
    <template #item.monthlyAmount="{ item }">{{ formatMoney(item.monthlyAmount) }}</template>
    <template #item.estimatedComputedTotal="{ item }">{{
      formatMoney(item.estimatedComputedTotal)
    }}</template>
    <template #item.actualComputedTotal="{ item }">{{
      formatMoney(item.actualComputedTotal)
    }}</template>
    <template #item.estimatedChildOccupancyRate.edit="{ item }">
      <v-text-field
        v-model="item.estimatedChildOccupancyRate"
        type="text"
        inputmode="decimal"
        :disabled="isBlocked"
        hide-details
      />
    </template>
    <template #item.actualChildOccupancyRate.edit="{ item }">
      <v-text-field
        v-model="item.actualChildOccupancyRate"
        type="text"
        inputmode="decimal"
        :disabled="isBlocked"
        hide-details
      />
    </template>
    <template #item.actions="{ item }">
      <v-btn
        v-if="item.policy.destroy"
        color="error"
        variant="outlined"
        size="small"
        :loading="deletingId === item.id"
        :disabled="isBlocked"
        @click.stop="deleteRecord(item)"
        >Delete</v-btn
      >
    </template>
    <template
      v-if="!isErrored"
      #tfoot
    >
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
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef } from "vue"
import { keyBy, pick } from "lodash"

import { MAX_PER_PAGE } from "@/api/base-api"
import childrenWithDiverseNeedsFundingRecordsApi, {
  type ChildrenWithDiverseNeedsFundingRecordAsIndex,
  type ChildrenWithDiverseNeedsFundingRecordOccupancyAttributes,
} from "@/api/children-with-diverse-needs-funding-records-api"
import { replicateEstimatesApi } from "@/api/children-with-diverse-needs-funding-records"
import rethrowUnexpectedError from "@/api/errors/rethrow-unexpected-error"

import useChildrenWithDiverseNeedsFundingRecords from "@/use/use-children-with-diverse-needs-funding-records"
import useSnack from "@/use/use-snack"

import blockedToTrueConfirm from "@/utils/blocked-to-true-confirm"
import { formatMoney } from "@/utils/formatters"
import sumByDecimal from "@/utils/sum-by-decimal"

import EditDataTableVirtual from "@/components/common/EditDataTableVirtual.vue"

const props = withDefaults(
  defineProps<{
    where?: {
      centreId?: number
      fiscalPeriodId?: number
    }
    isReplicating?: boolean
  }>(),
  {
    where: () => ({}),
    isReplicating: false,
  }
)

const emit = defineEmits<{
  updated: []
  mutationSettled: []
}>()

const query = computed(() => ({
  where: props.where,
  perPage: MAX_PER_PAGE,
}))

const {
  childrenWithDiverseNeedsFundingRecords,
  isLoading,
  isErrored,
  fetch: refresh,
} = useChildrenWithDiverseNeedsFundingRecords(query)

const headers = [
  { title: "Category", key: "categoryId" },
  { title: "Per Child", key: "monthlyAmount" },
  { title: "Est", key: "estimatedChildOccupancyRate" },
  { title: "Est Total", key: "estimatedComputedTotal" },
  { title: "Act", key: "actualChildOccupancyRate" },
  { title: "Act Total", key: "actualComputedTotal" },
  { title: "Actions", key: "actions", sortable: false },
]

const editableColumns: (keyof ChildrenWithDiverseNeedsFundingRecordOccupancyAttributes)[] = [
  "estimatedChildOccupancyRate",
  "actualChildOccupancyRate",
]

const totalEstimated = computed(() =>
  sumByDecimal(childrenWithDiverseNeedsFundingRecords.value, "estimatedComputedTotal").toFixed(4)
)

const totalActual = computed(() =>
  sumByDecimal(childrenWithDiverseNeedsFundingRecords.value, "actualComputedTotal").toFixed(4)
)

const totalEstimatedOccupancy = computed(() =>
  sumByDecimal(childrenWithDiverseNeedsFundingRecords.value, "estimatedChildOccupancyRate").toFixed(
    4
  )
)

const totalActualOccupancy = computed(() =>
  sumByDecimal(childrenWithDiverseNeedsFundingRecords.value, "actualChildOccupancyRate").toFixed(4)
)

const byId = computed(() => keyBy(childrenWithDiverseNeedsFundingRecords.value, "id"))

const editDataTableVirtual = useTemplateRef("editDataTableVirtual")

let currentSave: Promise<boolean> | null = null
const isSaving = ref(false)
const isDeleting = ref(false)
const deletingId = ref<number | null>(null)
const saveError = ref("")

const isBusy = computed(
  () => props.isReplicating || isSaving.value || isDeleting.value || isLoading.value
)

const isBlocked = computed(() => isBusy.value || isErrored.value)

const snack = useSnack()

function trackSave(record: ChildrenWithDiverseNeedsFundingRecordAsIndex) {
  if (isSaving.value) return

  currentSave = saveIfDirty(record)
  return currentSave
}

async function commitEdit(): Promise<boolean> {
  editDataTableVirtual.value?.commitEdit()
  const save = currentSave
  try {
    return (save === null || (await save)) && !isErrored.value
  } catch (error) {
    console.error("Failed to commit diverse need edit", { error })
    rethrowUnexpectedError(error)

    return false
  } finally {
    if (currentSave === save) currentSave = null
  }
}

async function saveIfDirty(record: ChildrenWithDiverseNeedsFundingRecordAsIndex) {
  const current = byId.value[record.id]
  if (!current || isBlocked.value) return false

  const changed = editableColumns.filter((field) => current[field] !== record[field])
  if (!changed.length) return true

  isSaving.value = true
  saveError.value = ""
  try {
    const { childrenWithDiverseNeedsFundingRecord } =
      await childrenWithDiverseNeedsFundingRecordsApi.update(record.id, pick(record, changed))
    const index = childrenWithDiverseNeedsFundingRecords.value.findIndex(
      (item) => item.id === record.id
    )
    if (index >= 0) {
      childrenWithDiverseNeedsFundingRecords.value.splice(index, 1, {
        ...current,
        ...childrenWithDiverseNeedsFundingRecord,
      })
    }

    snack.success("Diverse need saved!")
    emit("updated")
    return true
  } catch (error) {
    console.error("Failed to save diverse need", { error })
    rethrowUnexpectedError(error)

    saveError.value = `Failed to save diverse need: ${String(error)}. Retry your edit after reloading.`
    try {
      await refresh()
    } catch (error) {
      console.error("Failed to reload diverse needs after save failure", { error })
      rethrowUnexpectedError(error)

      // Preserve the save failure if reload also fails.
    }
    snack.error(saveError.value)
    return false
  } finally {
    isSaving.value = false
    emit("mutationSettled")
  }
}

async function deleteRecord(record: ChildrenWithDiverseNeedsFundingRecordAsIndex) {
  if (
    !record.policy.destroy ||
    isBlocked.value ||
    !blockedToTrueConfirm("Are you sure you want to remove this diverse need?")
  ) {
    return
  }

  if (!(await commitEdit())) return

  isDeleting.value = true
  deletingId.value = record.id
  try {
    await childrenWithDiverseNeedsFundingRecordsApi.delete(record.id)
    await refresh()
    snack.success("Diverse need deleted!")
    emit("updated")
  } catch (error) {
    console.error("Failed to delete diverse need", { error })
    rethrowUnexpectedError(error)

    snack.error(`Failed to delete diverse need: ${error}`)
  } finally {
    deletingId.value = null
    isDeleting.value = false
    emit("mutationSettled")
  }
}

async function reload() {
  try {
    await refresh()
    saveError.value = ""
    currentSave = null
  } catch (error) {
    console.error("Failed to load diverse needs", { error })
    rethrowUnexpectedError(error)

    snack.error(`Failed to load diverse needs: ${error}`)
  }
}

async function replicateEstimates() {
  if (isSaving.value || isDeleting.value || isLoading.value || isErrored.value) return

  isSaving.value = true
  const failures: unknown[] = []
  try {
    for (const record of childrenWithDiverseNeedsFundingRecords.value) {
      try {
        await replicateEstimatesApi.create(record.id)
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
      const message = `Failed to replicate diverse need estimates: ${failures.map(String).join("; ")}`
      const aggregateError = new AggregateError(failures, message)
      console.error("Failed to replicate diverse need estimates", { error: aggregateError })
      rethrowUnexpectedError(aggregateError)

      snack.error(message)
      throw aggregateError
    }
  } finally {
    isSaving.value = false
    emit("mutationSettled")
  }
}

defineExpose({
  refresh,
  replicateEstimates,
  commitEdit,
  isSaving,
  isDeleting,
  isLoading,
  isErrored,
  categoryIds: computed(() =>
    childrenWithDiverseNeedsFundingRecords.value.map(({ categoryId }) => categoryId)
  ),
})
</script>
