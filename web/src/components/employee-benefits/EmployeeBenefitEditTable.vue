<template>
  <v-skeleton-loader
    v-if="isNil(employeeBenefit) || employeeBenefit.id !== employeeBenefitId"
    type="table"
  />
  <v-table v-else>
    <thead>
      <tr>
        <th></th>
        <th class="text-left">Est. Total</th>
        <th></th>
        <th class="text-left">Act. Total</th>
      </tr>
    </thead>
    <tbody>
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
      <tr>
        <td></td>
        <td></td>
        <td></td>
        <td class="d-flex justify-end pt-4">
          <v-alert
            v-if="saveError"
            class="mb-2"
            type="error"
            density="compact"
            role="alert"
          >
            {{ saveError }}
          </v-alert>
          <v-btn
            color="success"
            :loading="isSaving"
            @click="saveAndNotify"
          >
            Save
          </v-btn>
        </td>
      </tr>
    </tbody>
  </v-table>
</template>

<script setup lang="ts">
import { computed, ref, toRefs, watch } from "vue"
import { isNil } from "lodash"
import Big from "big.js"

import { formatMoney } from "@/utils/formatters"
import minDecimal from "@/utils/min-decimal"

import employeeBenefitsApi from "@/api/employee-benefits-api"

import useSnack from "@/use/use-snack"
import useEmployeeBenefit from "@/use/use-employee-benefit"

import CurrencyInput from "@/components/CurrencyInput.vue"

type EditableAttribute =
  | "grossPayrollMonthlyActual"
  | "grossPayrollMonthlyEstimated"
  | "costCapPercentage"
  | "employeeCostActual"
  | "employeeCostEstimated"
  | "employerCostActual"
  | "employerCostEstimated"

const props = defineProps<{
  employeeBenefitId: number
}>()

const { employeeBenefitId } = toRefs(props)
const { employeeBenefit } = useEmployeeBenefit(employeeBenefitId)
const isEditingCostCapPercentage = ref(false)
const savedValues = ref<Partial<Record<EditableAttribute, string>>>({})
const latestValues = ref<Partial<Record<EditableAttribute, string>>>({})
const savingAttributes = new Set<string>()
const isSaving = ref(false)
const saveErrors = ref<Partial<Record<EditableAttribute, string>>>({})
const saveError = computed(() => Object.values(saveErrors.value).find(Boolean) ?? "")
const initializedBenefitId = ref<number | null>(null)

watch(
  employeeBenefitId,
  () => {
    savedValues.value = {}
    latestValues.value = {}
    saveErrors.value = {}
    initializedBenefitId.value = null
  },
  { flush: "sync" }
)

watch(
  [employeeBenefitId, employeeBenefit],
  ([benefitId, benefit]) => {
    if (isNil(benefit) || benefit.id !== benefitId || initializedBenefitId.value === benefitId) {
      return
    }

    savedValues.value = {
      grossPayrollMonthlyActual: benefit.grossPayrollMonthlyActual,
      grossPayrollMonthlyEstimated: benefit.grossPayrollMonthlyEstimated,
      costCapPercentage: benefit.costCapPercentage,
      employeeCostActual: benefit.employeeCostActual,
      employeeCostEstimated: benefit.employeeCostEstimated,
      employerCostActual: benefit.employerCostActual,
      employerCostEstimated: benefit.employerCostEstimated,
    }
    initializedBenefitId.value = benefitId
  },
  { immediate: true }
)

const costCapPercentageDraft = ref("")
const costCapPercentageDraftAtEditStart = ref("")

const costCapPercentage = computed(() => {
  if (isNil(employeeBenefit.value)) {
    return "0"
  }

  return Big(employeeBenefit.value.costCapPercentage).mul(100).toFixed(2)
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
  if (
    isNil(employeeBenefit.value) ||
    employeeBenefit.value.id !== employeeBenefitId.value ||
    costCapPercentageDraft.value === costCapPercentageDraftAtEditStart.value
  ) {
    return
  }

  let costCapPercentageValue: string
  try {
    costCapPercentageValue = Big(costCapPercentageDraft.value).div("100").toFixed(4)
  } catch {
    costCapPercentageValue = "0"
    costCapPercentageDraft.value = "0"
  }

  employeeBenefit.value.costCapPercentage = costCapPercentageValue
  saveAttribute("costCapPercentage", costCapPercentageValue)
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
  attribute: Exclude<EditableAttribute, "costCapPercentage">,
  newValue: string | null
) {
  if (isNil(employeeBenefit.value) || employeeBenefit.value.id !== employeeBenefitId.value) {
    return
  }

  const value = newValue === "-" || newValue === "" || newValue === null ? "0" : newValue
  if (value === employeeBenefit.value[attribute]) {
    return
  }

  employeeBenefit.value[attribute] = value
  saveAttribute(attribute, value)
}

function saveAttribute(attribute: EditableAttribute, value: string) {
  const savingKey = `${employeeBenefitId.value}:${attribute}`
  if (value === savedValues.value[attribute]) {
    if (savingAttributes.has(savingKey)) {
      latestValues.value[attribute] = value
    } else {
      delete latestValues.value[attribute]
      delete saveErrors.value[attribute]
    }

    return
  }

  latestValues.value[attribute] = value
  void saveLatestAttributeValue(attribute)
}

async function saveLatestAttributeValue(attribute: EditableAttribute) {
  const benefitId = employeeBenefitId.value
  const savingKey = `${benefitId}:${attribute}`
  if (savingAttributes.has(savingKey)) {
    return
  }

  savingAttributes.add(savingKey)
  isSaving.value = true

  try {
    while (latestValues.value[attribute] !== savedValues.value[attribute]) {
      const value = latestValues.value[attribute]
      if (
        isNil(value) ||
        isNil(employeeBenefit.value) ||
        employeeBenefit.value.id !== benefitId ||
        employeeBenefitId.value !== benefitId
      ) {
        return
      }

      await employeeBenefitsApi.update(benefitId, { [attribute]: value })
      if (employeeBenefitId.value !== benefitId) {
        return
      }

      savedValues.value[attribute] = value
    }

    delete latestValues.value[attribute]
    delete saveErrors.value[attribute]
  } catch (error) {
    if (employeeBenefitId.value === benefitId) {
      saveErrors.value[attribute] = `Failed to save employee benefit: ${error}`
    }
  } finally {
    savingAttributes.delete(savingKey)
    isSaving.value = savingAttributes.size > 0
  }
}

const snack = useSnack()

async function saveAndNotify() {
  if (isNil(employeeBenefit.value) || employeeBenefit.value.id !== employeeBenefitId.value) {
    return
  }

  const attributes = Object.keys(latestValues.value) as EditableAttribute[]
  for (const attribute of attributes) {
    latestValues.value[attribute] = employeeBenefit.value[attribute]
  }

  await Promise.all(attributes.map(saveLatestAttributeValue))

  if (saveError.value) {
    snack.error(saveError.value)
    return
  }

  snack.success("Employee benefit saved successfully!")
}
</script>
