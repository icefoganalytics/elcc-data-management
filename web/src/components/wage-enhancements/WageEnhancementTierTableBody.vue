<template>
  <v-skeleton-loader
    v-if="isNil(employeeWageTier)"
    type="table-row"
  />
  <tbody v-else>
    <tr class="bg-grey-lighten-2">
      <td>{{ employeeWageTier.tierLabel }}</td>
      <td colspan="5"></td>
      <td class="d-flex justify-end align-center">
        <v-btn
          title="Add employee"
          icon="$plus"
          density="comfortable"
          color="yg-blue"
          :loading="isCreating"
          @click="createWageEnhancement"
        />
      </td>
    </tr>
    <tr
      v-for="wageEnhancement in wageEnhancements"
      :key="`enhancement-${wageEnhancement.id}`"
    >
      <td>
        <v-text-field
          v-model="wageEnhancement.employeeName"
          aria-label="Employee Name"
          density="compact"
          variant="underlined"
          hide-details
          @blur="saveField(wageEnhancement.id, 'employeeName')"
          @keydown.enter.prevent="saveField(wageEnhancement.id, 'employeeName')"
        />
      </td>
      <td>
        <v-text-field
          :model-value="formatMoney(employeeWageTier.wageRatePerHour)"
          aria-label="Wage Rate Per Hour"
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
          v-model="wageEnhancement.hoursEstimated"
          aria-label="Hours Estimated"
          density="compact"
          variant="underlined"
          hide-details
          @blur="saveField(wageEnhancement.id, 'hoursEstimated')"
          @keydown.enter.prevent="saveField(wageEnhancement.id, 'hoursEstimated')"
        />
      </td>
      <td>
        <v-text-field
          :model-value="formatMoney(calculateTotal(wageEnhancement, 'hoursEstimated'))"
          aria-label="Wage Enhancement Total Estimated"
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
          v-model="wageEnhancement.hoursActual"
          aria-label="Hours Actual"
          density="compact"
          variant="underlined"
          hide-details
          @blur="saveField(wageEnhancement.id, 'hoursActual')"
          @keydown.enter.prevent="saveField(wageEnhancement.id, 'hoursActual')"
        />
      </td>
      <td>
        <v-text-field
          :model-value="formatMoney(calculateTotal(wageEnhancement, 'hoursActual'))"
          aria-label="Wage Enhancement Total Actual"
          color="primary"
          density="compact"
          tabindex="-1"
          variant="plain"
          hide-details
          readonly
        />
      </td>
      <td class="d-flex justify-end align-center">
        <v-btn
          icon="mdi-content-save"
          title="Save"
          density="comfortable"
          variant="text"
          :loading="isLoadingByWageEnhancementId.get(wageEnhancement.id)"
          @click="saveChangedFields(wageEnhancement.id)"
        />
        <v-btn
          icon="mdi-close"
          title="Delete"
          class="ml-2"
          color="error"
          density="comfortable"
          variant="text"
          :loading="isLoadingByWageEnhancementId.get(wageEnhancement.id)"
          @click="deleteWageEnhancement(wageEnhancement.id)"
        />
      </td>
    </tr>
    <tr
      v-for="wageEnhancement in wageEnhancements.filter(({ id }) => saveErrors.has(id))"
      :key="`save-error-${wageEnhancement.id}`"
    >
      <td colspan="7">
        <v-alert
          density="compact"
          type="error"
          variant="tonal"
        >
          {{ saveErrors.get(wageEnhancement.id) }}
        </v-alert>
      </td>
    </tr>
  </tbody>
</template>

<script setup lang="ts">
import { computed, reactive, ref, toRefs, watch } from "vue"
import { isNil } from "lodash"
import Big from "big.js"

import { formatMoney } from "@/utils/formatters"

import { MAX_PER_PAGE } from "@/api/base-api"
import wageEnhancementsApi from "@/api/wage-enhancements-api"
import useEmployeeWageTier from "@/use/use-employee-wage-tier"
import useWageEnhancements, { type WageEnhancement } from "@/use/use-wage-enhancements"
import useSnack from "@/use/use-snack"

const props = defineProps<{
  centreId: number
  employeeWageTierId: number
}>()

const emit = defineEmits<{
  updated: [wageEnhancementId: number]
}>()

const { employeeWageTierId } = toRefs(props)
const { employeeWageTier } = useEmployeeWageTier(employeeWageTierId)

const wageEnhancementsQuery = computed(() => ({
  where: {
    centreId: props.centreId,
    employeeWageTierId: props.employeeWageTierId,
  },
  perPage: MAX_PER_PAGE, // TODO: switch to paginated table.
}))
const { wageEnhancements } = useWageEnhancements(wageEnhancementsQuery)

type EditableField = "employeeName" | "hoursEstimated" | "hoursActual"
type EditableAttributes = Pick<WageEnhancement, EditableField>

function calculateTotal(
  wageEnhancement: WageEnhancement,
  attribute: keyof Pick<WageEnhancement, "hoursEstimated" | "hoursActual">
): string {
  if (isNil(employeeWageTier.value)) return "0.0000"

  const { wageRatePerHour } = employeeWageTier.value
  if (isNil(wageRatePerHour)) return "0.0000"

  const hours = wageEnhancement[attribute]
  if (isNil(hours)) return "0.0000"

  return Big(hours).mul(wageRatePerHour).toFixed(4)
}

const snack = useSnack()
const isCreating = ref(false)
const isLoadingByWageEnhancementId = reactive(new Map<number, boolean>())
const savedAttributesById = new Map<number, EditableAttributes>()
const saveQueuesById = new Map<number, Promise<void>>()
const saveErrors = reactive(new Map<number, string>())

watch(
  wageEnhancements,
  (rows) => {
    for (const row of rows) {
      if (savedAttributesById.has(row.id)) {
        continue
      }

      savedAttributesById.set(row.id, {
        employeeName: row.employeeName,
        hoursEstimated: row.hoursEstimated,
        hoursActual: row.hoursActual,
      })
    }
  },
  { immediate: true }
)

async function createWageEnhancement() {
  isCreating.value = true
  try {
    const { wageEnhancement } = await wageEnhancementsApi.create({
      employeeWageTierId: props.employeeWageTierId,
      centreId: props.centreId,
      employeeName: "",
      hoursEstimated: "0",
      hoursActual: "0",
    })
    wageEnhancements.value.push(wageEnhancement)
    savedAttributesById.set(wageEnhancement.id, {
      employeeName: wageEnhancement.employeeName,
      hoursEstimated: wageEnhancement.hoursEstimated,
      hoursActual: wageEnhancement.hoursActual,
    })
    snack.success("Wage enhancement created")
  } catch (error) {
    console.error(`Failed to create wage enhancement: ${error}`, { error })
    snack.error(`Failed to create wage enhancement: ${error}`)
  } finally {
    isCreating.value = false
  }
}

function saveField(wageEnhancementId: number, field: EditableField) {
  const row = wageEnhancements.value.find(({ id }) => id === wageEnhancementId)
  const savedAttributes = savedAttributesById.get(wageEnhancementId)
  if (isNil(row) || isNil(savedAttributes)) {
    return
  }

  if (row[field] === savedAttributes[field] && !saveQueuesById.has(wageEnhancementId)) {
    if (!hasUnsavedChanges(wageEnhancementId)) {
      saveErrors.delete(wageEnhancementId)
    }

    return
  }

  return queueSave(wageEnhancementId, { [field]: row[field] })
}

function saveChangedFields(wageEnhancementId: number) {
  const row = wageEnhancements.value.find(({ id }) => id === wageEnhancementId)
  const savedAttributes = savedAttributesById.get(wageEnhancementId)
  if (isNil(row) || isNil(savedAttributes)) {
    return
  }

  const changedAttributes: Partial<EditableAttributes> = {}
  for (const field of ["employeeName", "hoursEstimated", "hoursActual"] as const) {
    if (row[field] !== savedAttributes[field]) {
      changedAttributes[field] = row[field]
    }
  }

  if (Object.keys(changedAttributes).length === 0) {
    saveErrors.delete(wageEnhancementId)
  }

  return queueSave(wageEnhancementId, changedAttributes)
}

function hasUnsavedChanges(wageEnhancementId: number) {
  const row = wageEnhancements.value.find(({ id }) => id === wageEnhancementId)
  const savedAttributes = savedAttributesById.get(wageEnhancementId)
  if (isNil(row) || isNil(savedAttributes)) {
    return false
  }

  return (
    row.employeeName !== savedAttributes.employeeName ||
    row.hoursEstimated !== savedAttributes.hoursEstimated ||
    row.hoursActual !== savedAttributes.hoursActual
  )
}

function queueSave(wageEnhancementId: number, attributes: Partial<EditableAttributes>) {
  if (Object.keys(attributes).length === 0) {
    return Promise.resolve()
  }

  const previousSave = saveQueuesById.get(wageEnhancementId) ?? Promise.resolve()
  const queuedSave = previousSave.then(() => persistChanges(wageEnhancementId, attributes))
  saveQueuesById.set(wageEnhancementId, queuedSave)

  return queuedSave.finally(() => {
    if (saveQueuesById.get(wageEnhancementId) === queuedSave) {
      saveQueuesById.delete(wageEnhancementId)
    }
  })
}

async function persistChanges(wageEnhancementId: number, attributes: Partial<EditableAttributes>) {
  isLoadingByWageEnhancementId.set(wageEnhancementId, true)
  try {
    await wageEnhancementsApi.update(wageEnhancementId, attributes)

    const savedAttributes = savedAttributesById.get(wageEnhancementId)
    if (!isNil(savedAttributes)) {
      Object.assign(savedAttributes, attributes)
    }

    if (!hasUnsavedChanges(wageEnhancementId)) {
      saveErrors.delete(wageEnhancementId)
    }

    snack.success("Wage enhancement saved!")
    emit("updated", wageEnhancementId)
  } catch (error) {
    console.error(`Failed to update wage enhancement: ${error}`, { error })
    saveErrors.set(wageEnhancementId, `Failed to save wage enhancement: ${error}`)
    snack.error(`Failed to update wage enhancement: ${error}`)
  } finally {
    isLoadingByWageEnhancementId.set(wageEnhancementId, false)
  }
}

async function deleteWageEnhancement(wageEnhancementId: number) {
  isLoadingByWageEnhancementId.set(wageEnhancementId, true)
  try {
    await wageEnhancementsApi.delete(wageEnhancementId)
    wageEnhancements.value = wageEnhancements.value.filter(({ id }) => id !== wageEnhancementId)
    savedAttributesById.delete(wageEnhancementId)
    saveErrors.delete(wageEnhancementId)
    snack.success("Wage enhancement deleted.")
    emit("updated", wageEnhancementId)
  } catch (error) {
    console.error(`Failed to delete wage enhancement: ${error}`, { error })
    snack.error(`Failed to delete wage enhancement: ${error}`)
  } finally {
    isLoadingByWageEnhancementId.delete(wageEnhancementId)
  }
}

async function updateAll() {
  await Promise.all(wageEnhancements.value.map(({ id }) => saveChangedFields(id)))
}

defineExpose({
  updateAll,
})
</script>
