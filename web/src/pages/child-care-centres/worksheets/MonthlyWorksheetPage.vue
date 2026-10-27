<template>
  <div>
    <PageLoader
      v-if="isLoading"
      style="height: calc(100dvh - 14em) !important"
      message="Loading worksheets"
    />
    <v-alert
      v-else-if="loadError"
      type="error"
      variant="tonal"
      class="ma-5"
    >
      Worksheet data could not be loaded.
      <v-btn
        class="ml-3"
        variant="outlined"
        @click="loadWorksheet"
      >
        Reload Worksheet
      </v-btn>
    </v-alert>
    <v-empty-state
      v-else-if="!isNil(fundingSubmissionLineJson) && isNil(fiscalPeriod)"
      class="ma-5"
      headline="Fiscal Period Not Found"
      :title="`There is currently no fiscal period for ${monthAsDateName} ${fiscalYear}.`"
      text="Contact support, explain the page you were on, and what you were trying to do."
    >
      <template #actions>
        <v-btn
          color="primary"
          href="mailto:help+elcc@icefoganalytics.com"
          >Contact Support</v-btn
        >
      </template>
    </v-empty-state>
    <v-empty-state
      v-else-if="!isLoading && isNil(fundingSubmissionLineJson)"
      class="ma-5"
      headline="No Worksheets Found"
      :title="`There are currently no worksheets for ${fiscalYear}.`"
      text="Contact support, explain the page you were on, and what you were trying to do."
    >
      <template #actions>
        <v-btn
          color="primary"
          href="mailto:help+elcc@icefoganalytics.com"
          >Contact Support</v-btn
        >
      </template>
    </v-empty-state>
    <div v-else-if="!isNil(fundingSubmissionLineJson) && !isNil(fiscalPeriod)">
      <FundingSubmissionLineJsonEditSheet
        :key="`${centreId}-${fiscalYearSlug}-${month}-${fundingSubmissionLineJson.id}-${fiscalPeriod.id}`"
        :funding-submission-line-json-id="fundingSubmissionLineJson.id"
        :centre-id="centreId"
        :fiscal-period-id="fiscalPeriod.id"
        class="ma-4"
        @update:funding-submission-line-json="emit('update:fundingSubmissionLineJson', $event)"
      />

      <section class="ma-4 mt-8">
        <h3
          class="d-flex justify-space-between align-center mt-4 mb-2 ml-n2 pa-2 rounded bg-primary-lighten-2"
        >
          Building Expenses

          <v-icon
            title="Show keyboard shortcuts"
            class="included"
            @click="showKeyboardShortcutsModal"
          >
            mdi-keyboard
          </v-icon>
        </h3>

        <BuildingExpensesEditTable
          ref="buildingExpensesEditTable"
          :where="buildingExpenseWhere"
        />

        <v-row class="mt-4">
          <v-col
            v-if="!showBuildingExpenseCreateForm"
            cols="12"
            class="d-flex justify-end"
          >
            <v-btn
              color="primary"
              @click="showBuildingExpenseCreateForm = true"
            >
              Add Building Expense
            </v-btn>
          </v-col>
          <v-col
            v-else
            cols="12"
          >
            <BuildingExpenseCreateFormCard
              id="building-expense-create-form-card"
              :centre-id="centreId"
              :fiscal-period-id="fiscalPeriod.id"
              @created="closeCreateFormAndRefresh"
              @cancel="showBuildingExpenseCreateForm = false"
            />
          </v-col>
        </v-row>
      </section>
      <KeyboardShortcutsModal ref="keyboardShortcutsModal" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef, watch, watchEffect } from "vue"
import { isNil, upperFirst } from "lodash"
import { useHotkey } from "vuetify"
import { useRouteQuery } from "@vueuse/router"

import fiscalPeriodsApi, { type FiscalPeriod } from "@/api/fiscal-periods-api"
import fundingSubmissionLineJsonsApi, {
  type FundingSubmissionLineJsonAsIndex,
} from "@/api/funding-submission-line-jsons-api"
import sleepMs from "@/utils/sleep-ms"
import { booleanTransformer } from "@/utils/use-route-query-transformers"
import { FiscalPeriodMonths } from "@/use/use-fiscal-periods"

import PageLoader from "@/components/common/PageLoader.vue"
import KeyboardShortcutsModal from "@/components/common/KeyboardShortcutsModal.vue"
import FundingSubmissionLineJsonEditSheet from "@/components/funding-submission-line-jsons/FundingSubmissionLineJsonEditSheet.vue"
import BuildingExpenseCreateFormCard from "@/components/building-expenses/BuildingExpenseCreateFormCard.vue"
import BuildingExpensesEditTable from "@/components/building-expenses/BuildingExpensesEditTable.vue"

const props = defineProps<{
  centreId: number
  fiscalYearSlug: string
  month: FiscalPeriodMonths
}>()

const emit = defineEmits<{
  "update:fundingSubmissionLineJson": [fundingSubmissionLineJsonId: number]
}>()

const fiscalYear = computed(() => props.fiscalYearSlug.replace("-", "/"))
const monthAsDateName = computed(() => upperFirst(props.month))
const fundingSubmissionLineJson = ref<FundingSubmissionLineJsonAsIndex | null>(null)
const fiscalPeriod = ref<FiscalPeriod | null>(null)
const isLoading = ref(true)
const loadError = ref(false)
let activeRequest = 0

async function loadWorksheet() {
  const requestId = ++activeRequest
  isLoading.value = true
  loadError.value = false
  fundingSubmissionLineJson.value = null
  fiscalPeriod.value = null

  try {
    const [worksheetResponse, fiscalPeriodResponse] = await Promise.all([
      fundingSubmissionLineJsonsApi.list({
        where: {
          centreId: props.centreId,
          fiscalYear: fiscalYear.value,
          dateName: monthAsDateName.value,
        },
        perPage: 1,
      }),
      fiscalPeriodsApi.list({
        where: {
          fiscalYear: props.fiscalYearSlug,
          month: props.month,
        },
        perPage: 1,
      }),
    ])

    if (requestId !== activeRequest) {
      return
    }

    fundingSubmissionLineJson.value =
      worksheetResponse.fundingSubmissionLineJsons.find(
        (worksheet) =>
          worksheet.centreId === props.centreId &&
          worksheet.fiscalYear === fiscalYear.value &&
          worksheet.dateName === monthAsDateName.value
      ) ?? null
    fiscalPeriod.value =
      fiscalPeriodResponse.fiscalPeriods.find(
        (period) => period.fiscalYear === props.fiscalYearSlug && period.month === props.month
      ) ?? null
  } catch (error) {
    if (requestId === activeRequest) {
      console.error("Failed to load worksheet:", error)
      loadError.value = true
    }
  } finally {
    if (requestId === activeRequest) {
      isLoading.value = false
    }
  }
}

watch(() => [props.centreId, props.fiscalYearSlug, props.month], loadWorksheet, {
  immediate: true,
})

const buildingExpenseWhere = computed(() => ({
  centreId: props.centreId,
  fiscalPeriodId: fiscalPeriod.value?.id,
}))

const showBuildingExpenseCreateForm = useRouteQuery("showBuildingExpenseCreateForm", "false", {
  transform: booleanTransformer,
})

const keyboardShortcutsModal = useTemplateRef("keyboardShortcutsModal")
const buildingExpensesEditTable = useTemplateRef("buildingExpensesEditTable")

useHotkey("shift+?", showKeyboardShortcutsModal)

watchEffect(async () => {
  if (!showBuildingExpenseCreateForm.value) return

  await sleepMs(50)

  document.getElementById("building-expense-create-form-card")?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  })
})

function showKeyboardShortcutsModal() {
  keyboardShortcutsModal.value?.open()
}

async function closeCreateFormAndRefresh() {
  showBuildingExpenseCreateForm.value = false
  await buildingExpensesEditTable.value?.refresh()
}
</script>
