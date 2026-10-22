<template>
  <v-table class="position-relative">
    <template #top>
      <v-progress-linear
        :active="isSaving"
        indeterminate
        absolute
        location="top"
        height="2"
        color="primary"
        aria-label="Saving employee benefits"
      />
    </template>
    <thead>
      <tr>
        <th></th>
        <th class="text-left">Est. Total</th>
        <th></th>
        <th class="text-left">Act. Total</th>
      </tr>
    </thead>
    <tbody>
      <tr v-if="isNil(employeeBenefit)">
        <td
          colspan="4"
          role="status"
          class="text-center"
        >
          <v-progress-circular
            v-if="isLoading"
            indeterminate
            size="20"
            class="mr-2"
          />
          <span v-if="isErrored">Employee benefits could not be loaded.</span>
          <span v-else-if="isLoading">Loading employee benefits…</span>
          <span v-else-if="isNil(employeeBenefitId)">Loading employee benefits…</span>
          <span v-else>No employee benefits are available.</span>
          <v-btn
            v-if="isErrored"
            class="ml-2"
            variant="text"
            @click="reload"
          >
            Retry
          </v-btn>
        </td>
      </tr>
      <tr v-if="!isNil(employeeBenefit) && saveError">
        <td
          colspan="3"
          role="alert"
          class="text-error"
        >
          {{ saveError }}
        </td>
        <td class="text-right">
          <v-btn
            :loading="isSaving"
            @click="retry"
          >
            Retry
          </v-btn>
        </td>
      </tr>
      <template v-if="!isNil(employeeBenefit)">
        <tr>
          <td>Gross Payroll</td>
          <td>
            <CurrencyInput
              :model-value="employeeBenefit.grossPayrollMonthlyEstimated"
              aria-label="Gross Payroll Monthly Estimated"
              color="primary"
              density="compact"
              variant="underlined"
              hide-details
              @update:model-value="
                updateEmployeeBenefitCurrencyValue('grossPayrollMonthlyEstimated', $event)
              "
            />
          </td>
          <td></td>
          <td>
            <CurrencyInput
              :model-value="employeeBenefit.grossPayrollMonthlyActual"
              aria-label="Gross Payroll Monthly Actual"
              color="primary"
              density="compact"
              variant="underlined"
              hide-details
              @update:model-value="
                updateEmployeeBenefitCurrencyValue('grossPayrollMonthlyActual', $event)
              "
            />
          </td>
        </tr>
        <tr>
          <td>
            {{ costCapPercentage }}% of above
            <!-- TODO: clean up this code -->
            <v-btn
              aria-label="show/hide cost cap percentage input"
              size="x-small"
              icon="mdi-pencil"
              density="comfortable"
              color="yg-blue"
              :variant="isEditingCostCapPercentage ? 'outlined' : 'tonal'"
              @click="toggleEditingCostCapPercentage"
            >
            </v-btn>
            <v-text-field
              v-if="isEditingCostCapPercentage"
              v-model="costCapPercentageDraft"
              aria-label="Cost Cap Percentage"
              color="primary"
              density="compact"
              type="text"
              inputmode="decimal"
              variant="plain"
              hide-details
              @blur="commitCostCapPercentage"
              @keydown.enter="commitCostCapPercentage"
            />
          </td>
          <td>
            <v-text-field
              :model-value="formatMoney(monthlyBenefitCostCapEstimated)"
              aria-label="Monthly Benefit Cost Cap Estimated"
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
              :model-value="formatMoney(monthlyBenefitCostCapActual)"
              aria-label="Monthly Benefit Cost Cap Actual"
              color="primary"
              density="compact"
              tabindex="-1"
              variant="plain"
              hide-details
              readonly
            />
          </td>
        </tr>
        <tr>
          <td>Employee Cost</td>
          <td>
            <CurrencyInput
              :model-value="employeeBenefit.employeeCostEstimated"
              aria-label="Employee Cost Estimated"
              color="primary"
              density="compact"
              variant="underlined"
              hide-details
              @update:model-value="
                updateEmployeeBenefitCurrencyValue('employeeCostEstimated', $event)
              "
            />
          </td>
          <td></td>
          <td>
            <CurrencyInput
              :model-value="employeeBenefit.employeeCostActual"
              aria-label="Employee Cost Actual"
              color="primary"
              density="compact"
              variant="underlined"
              hide-details
              @update:model-value="updateEmployeeBenefitCurrencyValue('employeeCostActual', $event)"
            />
          </td>
        </tr>
        <tr>
          <td>Employer Cost</td>
          <td>
            <CurrencyInput
              :model-value="employeeBenefit.employerCostEstimated"
              aria-label="Employer Cost Estimated"
              color="primary"
              density="compact"
              variant="underlined"
              hide-details
              @update:model-value="
                updateEmployeeBenefitCurrencyValue('employerCostEstimated', $event)
              "
            />
          </td>
          <td></td>
          <td>
            <CurrencyInput
              :model-value="employeeBenefit.employerCostActual"
              aria-label="Employer Cost Actual"
              color="primary"
              density="compact"
              variant="underlined"
              hide-details
              @update:model-value="updateEmployeeBenefitCurrencyValue('employerCostActual', $event)"
            />
          </td>
        </tr>
        <tr>
          <td class="d-flex align-center">
            Total Cost
            <v-tooltip location="bottom">
              <template #activator="{ props: activatorProps }">
                <v-icon
                  class="ml-1"
                  v-bind="activatorProps"
                  >mdi-help-circle-outline</v-icon
                >
              </template>
              <span class="text-white"> Totaling the sum of Employee Cost plus Employer Cost </span>
            </v-tooltip>
          </td>
          <td>
            <v-text-field
              :model-value="formatMoney(totalCostEstimated)"
              aria-label="Total Cost Estimated"
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
              :model-value="formatMoney(totalCostActual)"
              aria-label="Total Cost Actual"
              color="primary"
              density="compact"
              tabindex="-1"
              variant="plain"
              hide-details
              readonly
            />
          </td>
        </tr>
        <tr>
          <td class="text-uppercase d-flex align-center">
            Paid Amount
            <v-tooltip location="bottom">
              <template #activator="{ props: activatorProps }">
                <v-icon
                  class="ml-1"
                  v-bind="activatorProps"
                  >mdi-help-circle-outline</v-icon
                >
              </template>
              <span class="text-white">
                Totaling the lesser of either {{ costCapPercentage }}% of Gross Payroll or Employer
                Cost
              </span>
            </v-tooltip>
          </td>
          <td>
            <v-text-field
              :model-value="formatMoney(minimumPaidAmountEstimated)"
              aria-label="Minimum Paid Amount Estimated"
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
              :model-value="formatMoney(minimumPaidAmountActual)"
              aria-label="Minimum Paid Amount Actual"
              color="primary"
              density="compact"
              tabindex="-1"
              variant="plain"
              hide-details
              readonly
            />
          </td>
        </tr>
      </template>
    </tbody>
  </v-table>
</template>
<script setup lang="ts">
import { computed, reactive, ref, toRefs, watch } from "vue"
import { isNil, isUndefined } from "lodash"
import Big from "big.js"

import { formatMoney } from "@/utils/formatters"
import minDecimal from "@/utils/min-decimal"

import employeeBenefitsApi, { type EmployeeBenefitAsShow } from "@/api/employee-benefits-api"
import useEmployeeBenefit from "@/use/use-employee-benefit"

import CurrencyInput from "@/components/CurrencyInput.vue"

const EDITABLE_ATTRIBUTES = [
  "grossPayrollMonthlyActual",
  "grossPayrollMonthlyEstimated",
  "costCapPercentage",
  "employeeCostActual",
  "employeeCostEstimated",
  "employerCostActual",
  "employerCostEstimated",
] as const
type EmployeeBenefitEditableAttribute = (typeof EDITABLE_ATTRIBUTES)[number]
type EmployeeBenefitChanges = Partial<Pick<EmployeeBenefitAsShow, EmployeeBenefitEditableAttribute>>
type RecordEditor = {
  record: EmployeeBenefitAsShow | null
  persistedAttributes: EmployeeBenefitChanges
  pendingChanges: EmployeeBenefitChanges
  writeRevisions: Partial<Record<EmployeeBenefitEditableAttribute, number>>
  saveErrors: Partial<Record<EmployeeBenefitEditableAttribute, string>>
  savingAttributes: Set<EmployeeBenefitEditableAttribute>
  writes: Map<EmployeeBenefitEditableAttribute, Promise<void>>
}

const props = defineProps<{ employeeBenefitId: number | undefined }>()
const { employeeBenefitId } = toRefs(props)
const editors = new Map<number, RecordEditor>()
const writeRevisionsAtFetchById = new Map<
  number,
  Partial<Record<EmployeeBenefitEditableAttribute, number>>
>()

function editorFor(recordId: number): RecordEditor {
  let editor = editors.get(recordId)
  if (isUndefined(editor)) {
    editor = reactive<RecordEditor>({
      record: null,
      persistedAttributes: {},
      pendingChanges: {},
      writeRevisions: {},
      saveErrors: {},
      savingAttributes: new Set(),
      writes: new Map(),
    })
    editors.set(recordId, editor)
  }

  return editor
}

// Capture the write boundary for the next selected-record load.
watch(
  employeeBenefitId,
  (recordId) => {
    if (isNil(recordId)) return

    writeRevisionsAtFetchById.set(recordId, { ...editorFor(recordId).writeRevisions })
  },
  { immediate: true }
)
const {
  employeeBenefit: fetchedEmployeeBenefit,
  isLoading,
  isErrored,
  fetch,
} = useEmployeeBenefit(employeeBenefitId)
const currentEditor = computed(() => {
  if (isNil(employeeBenefitId.value)) return undefined

  return editors.get(employeeBenefitId.value)
})
const employeeBenefit = computed(() => {
  if (isNil(fetchedEmployeeBenefit.value)) return null

  return currentEditor.value?.record ?? null
})
const isSaving = computed(() => (currentEditor.value?.savingAttributes.size ?? 0) > 0)
const saveError = computed(
  () => Object.values(currentEditor.value?.saveErrors ?? {}).find(Boolean) ?? ""
)

watch(fetchedEmployeeBenefit, (record) => {
  if (isNil(record)) return

  const editor = editorFor(record.id)
  const revisionsAtFetch = writeRevisionsAtFetchById.get(record.id) ?? {}
  const mergedRecord = { ...record }
  for (const attribute of EDITABLE_ATTRIBUTES) {
    const retainedValue = editor.record?.[attribute] ?? editor.persistedAttributes[attribute]
    const hasPendingChange = !isUndefined(editor.pendingChanges[attribute])
    const wasSavedDuringFetch = editor.writeRevisions[attribute] !== revisionsAtFetch[attribute]
    if ((hasPendingChange || wasSavedDuringFetch) && !isUndefined(retainedValue)) {
      mergedRecord[attribute] = retainedValue
      continue
    }

    editor.persistedAttributes[attribute] = mergedRecord[attribute]
  }
  editor.record = mergedRecord
})

const isEditingCostCapPercentage = ref(false)

const costCapPercentageDraft = ref("")
const costCapPercentageDraftAtEditStart = ref("")

watch(employeeBenefitId, () => {
  isEditingCostCapPercentage.value = false
  costCapPercentageDraft.value = ""
  costCapPercentageDraftAtEditStart.value = ""
})

function updateAttribute(attribute: EmployeeBenefitEditableAttribute, value: string) {
  const editor = currentEditor.value
  const recordId = employeeBenefitId.value
  if (!editor?.record || isNil(employeeBenefit.value) || isNil(recordId)) return

  editor.record[attribute] = value
  if (value === editor.persistedAttributes[attribute] && !editor.writes.has(attribute)) {
    delete editor.pendingChanges[attribute]
    delete editor.saveErrors[attribute]
    return
  }

  editor.pendingChanges[attribute] = value
  void saveAttribute(editor, recordId, attribute)
}

function saveAttribute(
  editor: RecordEditor,
  recordId: number,
  attribute: EmployeeBenefitEditableAttribute
): Promise<void> {
  const activeWrite = editor.writes.get(attribute)
  if (activeWrite) return activeWrite

  editor.savingAttributes.add(attribute)
  const write = persistAttribute(editor, recordId, attribute).finally(() => {
    editor.savingAttributes.delete(attribute)
    editor.writes.delete(attribute)
  })
  editor.writes.set(attribute, write)
  return write
}

async function persistAttribute(
  editor: RecordEditor,
  recordId: number,
  attribute: EmployeeBenefitEditableAttribute
) {
  try {
    while (editor.pendingChanges[attribute] !== editor.persistedAttributes[attribute]) {
      const value = editor.pendingChanges[attribute]
      if (isUndefined(value)) return

      await employeeBenefitsApi.update(recordId, { [attribute]: value })
      editor.persistedAttributes[attribute] = value
      editor.writeRevisions[attribute] = (editor.writeRevisions[attribute] ?? 0) + 1
    }
    delete editor.pendingChanges[attribute]
    delete editor.saveErrors[attribute]
  } catch (error) {
    editor.saveErrors[attribute] = `Failed to save employee benefit: ${error}`
    console.error(`Failed to save employee benefit: ${error}`, { error })
  }
}

async function save() {
  const editor = currentEditor.value
  const recordId = employeeBenefitId.value
  if (!editor || isNil(recordId)) return

  const attributes = EDITABLE_ATTRIBUTES.filter(
    (attribute) => !isUndefined(editor.pendingChanges[attribute])
  )
  await Promise.all(attributes.map((attribute) => saveAttribute(editor, recordId, attribute)))
}

const costCapPercentage = computed(() => {
  if (isNil(employeeBenefit.value)) return "0"

  return Big(employeeBenefit.value.costCapPercentage).mul("100").toFixed(2)
})

function toggleEditingCostCapPercentage() {
  if (isEditingCostCapPercentage.value) {
    commitCostCapPercentage()
    isEditingCostCapPercentage.value = false
    return
  }

  costCapPercentageDraft.value = costCapPercentage.value
  costCapPercentageDraftAtEditStart.value = costCapPercentage.value
  isEditingCostCapPercentage.value = true
}

function commitCostCapPercentage() {
  if (costCapPercentageDraft.value === costCapPercentageDraftAtEditStart.value) {
    return
  }

  let costCapPercentageValue: string
  try {
    costCapPercentageValue = Big(costCapPercentageDraft.value).div("100").toFixed(4)
  } catch {
    costCapPercentageValue = "0"
    costCapPercentageDraft.value = "0"
  }

  updateAttribute("costCapPercentage", costCapPercentageValue)
  costCapPercentageDraftAtEditStart.value = costCapPercentageDraft.value
}

const monthlyBenefitCostCapEstimated = computed(() => {
  if (isNil(employeeBenefit.value)) {
    return Big(0)
  }

  return Big(employeeBenefit.value.grossPayrollMonthlyEstimated).mul(
    employeeBenefit.value.costCapPercentage
  )
})

const monthlyBenefitCostCapActual = computed(() => {
  if (isNil(employeeBenefit.value)) {
    return Big(0)
  }

  return Big(employeeBenefit.value.grossPayrollMonthlyActual).mul(
    employeeBenefit.value.costCapPercentage
  )
})

const totalCostEstimated = computed(() => {
  if (isNil(employeeBenefit.value)) {
    return Big(0)
  }

  return Big(employeeBenefit.value.employeeCostEstimated).plus(
    employeeBenefit.value.employerCostEstimated
  )
})

const totalCostActual = computed(() => {
  if (isNil(employeeBenefit.value)) {
    return Big(0)
  }

  return Big(employeeBenefit.value.employeeCostActual).plus(
    employeeBenefit.value.employerCostActual
  )
})

const minimumPaidAmountEstimated = computed(() => {
  if (isNil(employeeBenefit.value)) {
    return Big(0)
  }

  return minDecimal(
    Big(employeeBenefit.value.employerCostEstimated),
    monthlyBenefitCostCapEstimated.value
  )
})

const minimumPaidAmountActual = computed(() => {
  if (isNil(employeeBenefit.value)) {
    return Big(0)
  }

  return minDecimal(
    Big(employeeBenefit.value.employerCostActual),
    monthlyBenefitCostCapActual.value
  )
})

function updateEmployeeBenefitCurrencyValue(
  attribute: Exclude<EmployeeBenefitEditableAttribute, "costCapPercentage">,
  newValue: string | null
) {
  const value = newValue === "-" || newValue === "" || newValue === null ? "0" : newValue
  updateAttribute(attribute, value)
}

async function retry() {
  await save()
}

async function reload() {
  if (!isNil(employeeBenefitId.value)) {
    writeRevisionsAtFetchById.set(employeeBenefitId.value, {
      ...editorFor(employeeBenefitId.value).writeRevisions,
    })
  }

  await fetch()
}
</script>
