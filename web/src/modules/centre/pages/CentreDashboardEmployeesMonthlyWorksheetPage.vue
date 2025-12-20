<template>
  <v-skeleton-loader v-if="isNil(fiscalPeriodId)">
    <template #default>
      <v-container>
        <v-row>
          <v-col>
            <v-skeleton-loader type="heading" />
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-skeleton-loader type="heading" />
            <v-skeleton-loader
              type="card"
              height="200px"
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-skeleton-loader type="heading" />
            <v-skeleton-loader
              type="card"
              height="200px"
            />
          </v-col>
        </v-row>
      </v-container>
    </template>
  </v-skeleton-loader>
  <v-container v-else>
    <v-row>
      <v-col>
        <h2>{{ fiscalPeriodFormattedDate }}</h2>
      </v-col>
    </v-row>
    <v-row>
      <v-col tag="section">
        <h3 class="mt-4 mb-2 ml-n2 pa-2 rounded bg-primary-lighten-2">Employee Benefits</h3>

        <v-alert
          v-if="employeeBenefitNotFound"
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
          v-else
          :employee-benefit-id="employeeBenefitId"
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col tag="section">
        <h3 class="d-flex justify-space-between mt-4 mb-2 ml-n2 pa-2 rounded bg-primary-lighten-2">
          Wage Enhancements

          <ReplicateEstimatesButton
            :centre-id="props.centreId"
            :fiscal-period-id="fiscalPeriodId"
          />
        </h3>

        <div class="d-flex justify-end mb-2">
          <v-btn
            v-if="!showWageEnhancementCreateForm"
            color="yg-blue"
            prepend-icon="mdi-plus"
            @click="showWageEnhancementCreateForm = true"
          >
            Add Employee
          </v-btn>
        </div>

        <WageEnhancementCreateFormCard
          v-if="showWageEnhancementCreateForm"
          id="wage-enhancement-create-form-card"
          :centre-id="props.centreId"
          :fiscal-period-id="fiscalPeriodId"
          elevation="0"
          class="mb-4"
          @created="closeCreateFormAndRefresh"
          @cancel="showWageEnhancementCreateForm = false"
        />

        <WageEnhancementsEditTable
          ref="wageEnhancementsEditTable"
          :centre-id="props.centreId"
          :fiscal-period-id="fiscalPeriodId"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef } from "vue"
import { isEmpty, isNil } from "lodash"

import DateTimeUtils from "@/utils/date-time-utils"
import useFiscalPeriods, { FiscalPeriodMonths } from "@/use/use-fiscal-periods"
import useEmployeeBenefits from "@/use/use-employee-benefits"

import EmployeeBenefitEditTable from "@/components/employee-benefits/EmployeeBenefitEditTable.vue"
import WageEnhancementCreateFormCard from "@/components/wage-enhancements/WageEnhancementCreateFormCard.vue"
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
const { fiscalPeriods } = useFiscalPeriods(fiscalPeriodsQuery)
const fiscalPeriod = computed(() => fiscalPeriods.value[0])
const fiscalPeriodId = computed(() => fiscalPeriod.value?.id)
const fiscalPeriodFormattedDate = computed(() => {
  if (isEmpty(fiscalPeriod.value)) return ""

  const { dateStart } = fiscalPeriod.value
  const formattedDate = DateTimeUtils.fromISO(dateStart).toUTC().toFormat("MMMM yyyy")
  return formattedDate
})

const employeeBenefitsQuery = computed(() => ({
  where: {
    centreId: props.centreId,
    fiscalPeriodId: fiscalPeriodId.value,
  },
}))
const { employeeBenefits, isLoading: isLoadingEmployeeBenefits } = useEmployeeBenefits(
  employeeBenefitsQuery,
  {
    skipWatchIf: () => isNil(fiscalPeriodId.value),
  }
)
const employeeBenefitId = computed(() => employeeBenefits.value[0]?.id)
const employeeBenefitNotFound = computed(
  () => !isLoadingEmployeeBenefits.value && isEmpty(employeeBenefits.value)
)

const showWageEnhancementCreateForm = ref(false)
const wageEnhancementsEditTable = useTemplateRef("wageEnhancementsEditTable")

async function closeCreateFormAndRefresh() {
  showWageEnhancementCreateForm.value = false
  await wageEnhancementsEditTable.value?.refresh()
}
</script>

<style scoped></style>
