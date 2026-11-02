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
      :inert="isBusy"
      :aria-busy="isBusy"
      :headers="headers"
      :items="administrationCosts"
      :loading="isLoading || isSaving || isDeleting"
      :editable-columns="editableColumns"
      fixed-footer
      disable-sort
      @update:cell="trackSave"
    >
      <template #item.categoryId="{ item }">{{ item.lineName }}</template>
      <template #item.monthlyAmount="{ item }">{{ formatMoney(item.monthlyAmount) }}</template>
      <template #item.estimatedChildOccupancyRate="{ item }">{{
        item.estimatedChildOccupancyRate
      }}</template>
      <template #item.estimatedComputedTotal="{ item }">{{
        formatMoney(item.estimatedComputedTotal)
      }}</template>
      <template #item.actualChildOccupancyRate="{ item }">{{
        item.actualChildOccupancyRate
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
import { keyBy, pick } from "lodash"
import { formatMoney } from "@/utils/formatters"
import sumByDecimal from "@/utils/sum-by-decimal"
import blockedToTrueConfirm from "@/utils/blocked-to-true-confirm"
import { MAX_PER_PAGE } from "@/api/base-api"
import administrationCostsApi, {
  type AdministrationCostAsIndex,
  type AdministrationCostOccupancyAttributes,
} from "@/api/administration-costs-api"
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
const emit = defineEmits<{ updated: []; mutationSettled: [] }>()
const query = computed(() => ({ where: props.where, perPage: MAX_PER_PAGE }))
const { administrationCosts, isLoading, isErrored, fetch } = useAdministrationCosts(query)
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
  sumByDecimal(administrationCosts.value, "estimatedComputedTotal").toFixed(4)
)
const totalActual = computed(() =>
  sumByDecimal(administrationCosts.value, "actualComputedTotal").toFixed(4)
)
const totalEstimatedOccupancy = computed(() =>
  sumByDecimal(administrationCosts.value, "estimatedChildOccupancyRate").toFixed(4)
)
const totalActualOccupancy = computed(() =>
  sumByDecimal(administrationCosts.value, "actualChildOccupancyRate").toFixed(4)
)
const byId = computed(() => keyBy(administrationCosts.value, "id"))
const categoryIds = computed(() => administrationCosts.value.map(({ categoryId }) => categoryId))
const editTable = useTemplateRef<{ commitEdit: () => void }>("editTable")
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
}

async function commitEdit(): Promise<boolean> {
  editTable.value?.commitEdit()
  const save = currentSave
  try {
    return (save === null || (await save)) && !isErrored.value
  } catch {
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
  const changed = editableColumns.filter((field) => current[field] !== record[field])
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
    snack.success("Administration cost saved!")
    emit("updated")
    return true
  } catch (error) {
    saveError.value = `Failed to save administration cost: ${String(error)}. Retry your edit after reloading.`
    try {
      await refresh()
    } catch {
      /* Preserve the save failure if reload also fails. */
    }
    snack.error(saveError.value)
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
    snack.error(`Failed to delete administration cost: ${error}`)
  } finally {
    deletingId.value = null
    isDeleting.value = false
    emit("mutationSettled")
  }
}

async function refresh() {
  return await fetch()
}

async function reload() {
  try {
    await refresh()
    saveError.value = ""
    currentSave = null
  } catch (error) {
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
      snack.error(message)
      throw new AggregateError(failures, message)
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
  categoryIds,
})
</script>
