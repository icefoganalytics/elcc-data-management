<template>
  <v-container>
    <v-skeleton-loader
      v-if="isLoadingFiscalPeriods"
      type="heading, table, table"
    />
    <v-alert
      v-else-if="isErroredFiscalPeriods"
      type="error"
      variant="tonal"
    >
      Monthly employee data could not be loaded. Reload the page to try again.
    </v-alert>
    <v-alert
      v-else-if="isNil(fiscalPeriodId)"
      type="warning"
      variant="tonal"
    >
      No fiscal period exists for the selected month.
    </v-alert>
    <v-row v-show="!isNil(fiscalPeriodId)">
      <v-col>
        <h2>{{ fiscalPeriodFormattedDate }}</h2>
      </v-col>
    </v-row>
    <v-row v-show="!isNil(fiscalPeriodId)">
      <v-col tag="section">
        <h3 class="mt-4 mb-2 ml-n2 pa-2 rounded bg-primary-lighten-2">Employee Benefits</h3>
        <v-alert
          v-if="isErroredEmployeeBenefits"
          type="error"
          variant="tonal"
        >
          Employee benefits could not be loaded. Reload the page to try again.
        </v-alert>
        <v-alert
          v-else-if="employeeBenefitNotFound"
          type="warning"
          variant="tonal"
          title="Employee Benefit Not Found"
        >
          No employee benefit record exists for this centre and fiscal period. This record should
          have been created during fiscal year initialization.
        </v-alert>
        <v-skeleton-loader
          v-else-if="isLoadingEmployeeBenefits"
          type="table"
        />
        <EmployeeBenefitEditTable
          v-show="!isNil(employeeBenefitId)"
          :employee-benefit-id="employeeBenefitId"
        />
      </v-col>
    </v-row>
    <v-row v-show="!isNil(fiscalPeriodId)">
      <v-col tag="section">
        <h3 class="d-flex justify-space-between mt-4 mb-2 ml-n2 pa-2 rounded bg-primary-lighten-2">
          Wage Enhancements
          <ReplicateEstimatesButton
            v-if="!isNil(fiscalPeriodId)"
            :centre-id="props.centreId"
            :fiscal-period-id="fiscalPeriodId"
          />
        </h3>
        <WageEnhancementsEditTable
          :centre-id="props.centreId"
          :fiscal-period-id="fiscalPeriodId"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { isEmpty, isNil } from "lodash"

import DateTimeUtils from "@/utils/date-time-utils"
import useFiscalPeriods, { FiscalPeriodMonths } from "@/use/use-fiscal-periods"
import useEmployeeBenefits from "@/use/use-employee-benefits"

import EmployeeBenefitEditTable from "@/components/employee-benefits/EmployeeBenefitEditTable.vue"
import WageEnhancementsEditTable from "@/components/wage-enhancements/WageEnhancementsEditTable.vue"
import ReplicateEstimatesButton from "@/components/wage-enhancements/ReplicateEstimatesButton.vue"

const props = defineProps<{
  centreId: number
  fiscalYearSlug: string
  month: FiscalPeriodMonths
}>()

const fiscalPeriodsQuery = computed(() => ({
  where: {
    fiscalYear: props.fiscalYearSlug,
    month: props.month,
  },
  perPage: 1,
}))
const {
  fiscalPeriods,
  isLoading: isLoadingFiscalPeriods,
  isErrored: isErroredFiscalPeriods,
} = useFiscalPeriods(fiscalPeriodsQuery)
const fiscalPeriod = computed(() => fiscalPeriods.value[0])
const fiscalPeriodId = computed(() => fiscalPeriod.value?.id)
const fiscalPeriodFormattedDate = computed(() => {
  if (isNil(fiscalPeriod.value)) return ""

  const { dateStart } = fiscalPeriod.value
  return DateTimeUtils.fromISO(dateStart).toUTC().toFormat("MMMM yyyy")
})

const employeeBenefitsQuery = computed(() => ({
  where: {
    centreId: props.centreId,
    fiscalPeriodId: fiscalPeriodId.value,
  },
}))
const {
  employeeBenefits,
  isLoading: isLoadingEmployeeBenefits,
  isErrored: isErroredEmployeeBenefits,
} = useEmployeeBenefits(employeeBenefitsQuery, {
  skipWatchIf: () => isNil(fiscalPeriodId.value),
})
const employeeBenefitId = computed(() => {
  if (isLoadingEmployeeBenefits.value || isErroredEmployeeBenefits.value) return undefined

  return employeeBenefits.value[0]?.id
})
const employeeBenefitNotFound = computed(
  () =>
    !isLoadingEmployeeBenefits.value &&
    !isErroredEmployeeBenefits.value &&
    isEmpty(employeeBenefits.value)
)
</script>
