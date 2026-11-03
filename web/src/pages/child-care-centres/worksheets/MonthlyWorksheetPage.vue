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
        ref="jsonSheet"
        :key="`${centreId}-${fiscalYearSlug}-${month}-${fundingSubmissionLineJson.id}-${fiscalPeriod.id}`"
        :funding-submission-line-json-id="fundingSubmissionLineJson.id"
        :centre-id="centreId"
        :fiscal-period-id="fiscalPeriod.id"
        class="ma-4"
        :is-workflow-busy="
          isWorksheetSaving || isReplicating || isLedgerMutating || isRefreshingLinked
        "
        @update:funding-submission-line-json="onJsonUpdated"
      >
        <template #actions>
          <div class="d-flex flex-wrap justify-end ga-2">
            <v-btn
              v-if="month === FiscalPeriodMonths.APRIL"
              color="yg-sun"
              :loading="isReplicating"
              :disabled="isWorkflowBusy || isReplicationUnavailable"
              @click="replicateEstimatesForward"
            >
              <v-icon>mdi-content-copy</v-icon>
              Replicate Estimates
            </v-btn>
          </div>
        </template>
        <template #section-actions>
          <v-btn
            color="primary"
            :loading="isWorksheetSaving"
            :disabled="isWorkflowBusy || isReplicationUnavailable"
            @click="saveWorksheet"
          >
            Save
          </v-btn>
        </template>
      </FundingSubmissionLineJsonEditSheet>
      <section class="ma-4 mt-8">
        <h3 class="mt-4 mb-2 ml-n2 pa-2 rounded bg-primary-lighten-2">
          Children with Diverse Needs
        </h3>
        <ChildrenWithDiverseNeedsFundingRecordEditTable
          ref="childrenWithDiverseNeedsFundingRecordTable"
          :where="worksheetWhere"
          :is-replicating="
            isReplicating ||
            isWorksheetSaving ||
            isRefreshingLinked ||
            isCreatingChildrenWithDiverseNeedsFundingRecord
          "
        />
        <v-row class="mt-0">
          <v-col
            v-if="!showChildrenWithDiverseNeedsFundingRecordCreateForm"
            cols="12"
            class="d-flex justify-end"
          >
            <v-btn
              color="primary"
              :disabled="
                isWorkflowBusy ||
                childrenWithDiverseNeedsFundingRecordTable?.isLoading ||
                childrenWithDiverseNeedsFundingRecordTable?.isErrored
              "
              @click="showChildrenWithDiverseNeedsFundingRecordCreateForm = true"
            >
              Add Diverse Need
            </v-btn>
          </v-col>
          <v-col
            v-else
            cols="12"
          >
            <ChildrenWithDiverseNeedsFundingRecordCreateFormCard
              :centre-id="centreId"
              :fiscal-period-id="fiscalPeriod.id"
              :funding-period-id="fiscalPeriod.fundingPeriodId"
              :existing-category-ids="childrenWithDiverseNeedsFundingRecordTable?.categoryIds ?? []"
              :is-workflow-busy="isReplicating || isWorksheetSaving || isRefreshingLinked"
              @saving="isCreatingChildrenWithDiverseNeedsFundingRecord = $event"
              @created="onChildrenWithDiverseNeedsFundingRecordCreated"
              @cancel="showChildrenWithDiverseNeedsFundingRecordCreateForm = false"
            />
          </v-col>
        </v-row>
      </section>
      <section class="ma-4 mt-8">
        <h3 class="mt-4 mb-2 ml-n2 pa-2 rounded bg-primary-lighten-2">
          Administration (10% of Spaces)
        </h3>
        <AdministrationCostEditTable
          ref="administrationCostTable"
          :where="worksheetWhere"
          :is-replicating="
            isReplicating || isWorksheetSaving || isRefreshingLinked || isCreatingAdministrationCost
          "
        />
        <v-row class="mt-0">
          <v-col
            v-if="!showAdministrationCostCreateForm"
            cols="12"
            class="d-flex justify-end"
          >
            <v-btn
              color="primary"
              :disabled="
                isWorkflowBusy ||
                administrationCostTable?.isLoading ||
                administrationCostTable?.isErrored
              "
              @click="showAdministrationCostCreateForm = true"
            >
              Add Administration Cost
            </v-btn>
          </v-col>
          <v-col
            v-else
            cols="12"
          >
            <AdministrationCostCreateFormCard
              :centre-id="centreId"
              :fiscal-period-id="fiscalPeriod.id"
              :funding-period-id="fiscalPeriod.fundingPeriodId"
              :existing-category-ids="administrationCostTable?.categoryIds ?? []"
              :is-workflow-busy="isReplicating || isWorksheetSaving || isRefreshingLinked"
              @saving="isCreatingAdministrationCost = $event"
              @created="onAdministrationCostCreated"
              @cancel="showAdministrationCostCreateForm = false"
            />
          </v-col>
        </v-row>
      </section>
      <section class="ma-4 mt-8">
        <h3 class="mt-4 mb-2 ml-n2 pa-2 rounded bg-primary-lighten-2">
          Quality Enhancement Program
        </h3>
        <QualityEnhancementEditTable
          ref="qualityEnhancementTable"
          :where="worksheetWhere"
          :is-replicating="
            isReplicating || isWorksheetSaving || isRefreshingLinked || isCreatingQualityEnhancement
          "
        />
        <v-row class="mt-0">
          <v-col
            v-if="!showQualityEnhancementCreateForm"
            cols="12"
            class="d-flex justify-end"
          >
            <v-btn
              color="primary"
              :disabled="
                isWorkflowBusy ||
                qualityEnhancementTable?.isLoading ||
                qualityEnhancementTable?.isErrored
              "
              @click="showQualityEnhancementCreateForm = true"
            >
              Add Quality Enhancement
            </v-btn>
          </v-col>
          <v-col
            v-else
            cols="12"
          >
            <QualityEnhancementCreateFormCard
              :centre-id="centreId"
              :fiscal-period-id="fiscalPeriod.id"
              :funding-period-id="fiscalPeriod.fundingPeriodId"
              :existing-category-ids="qualityEnhancementTable?.categoryIds ?? []"
              :is-workflow-busy="isReplicating || isWorksheetSaving || isRefreshingLinked"
              @saving="isCreatingQualityEnhancement = $event"
              @created="onQualityEnhancementCreated"
              @cancel="showQualityEnhancementCreateForm = false"
            />
          </v-col>
        </v-row>
      </section>

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
          :where="worksheetWhere"
        />

        <v-row class="mt-0">
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

import fiscalPeriodsApi, { type FiscalPeriod } from "@/api/fiscal-periods-api"
import fundingSubmissionLineJsonsApi, {
  type FundingSubmissionLineJsonAsIndex,
} from "@/api/funding-submission-line-jsons-api"
import rethrowUnexpectedError from "@/api/errors/rethrow-unexpected-error"
import sleepMs from "@/utils/sleep-ms"
import { FiscalPeriodMonths } from "@/use/use-fiscal-periods"

import PageLoader from "@/components/common/PageLoader.vue"
import KeyboardShortcutsModal from "@/components/common/KeyboardShortcutsModal.vue"
import FundingSubmissionLineJsonEditSheet from "@/components/funding-submission-line-jsons/FundingSubmissionLineJsonEditSheet.vue"
import BuildingExpenseCreateFormCard from "@/components/building-expenses/BuildingExpenseCreateFormCard.vue"
import BuildingExpensesEditTable from "@/components/building-expenses/BuildingExpensesEditTable.vue"
import AdministrationCostEditTable from "@/components/administration-costs/AdministrationCostEditTable.vue"
import AdministrationCostCreateFormCard from "@/components/administration-costs/AdministrationCostCreateFormCard.vue"
import QualityEnhancementEditTable from "@/components/quality-enhancements/QualityEnhancementEditTable.vue"
import QualityEnhancementCreateFormCard from "@/components/quality-enhancements/QualityEnhancementCreateFormCard.vue"
import ChildrenWithDiverseNeedsFundingRecordEditTable from "@/components/children-with-diverse-needs-funding-records/ChildrenWithDiverseNeedsFundingRecordEditTable.vue"
import ChildrenWithDiverseNeedsFundingRecordCreateFormCard from "@/components/children-with-diverse-needs-funding-records/ChildrenWithDiverseNeedsFundingRecordCreateFormCard.vue"
import useSnack from "@/use/use-snack"
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
const showChildrenWithDiverseNeedsFundingRecordCreateForm = ref(false)
const isCreatingChildrenWithDiverseNeedsFundingRecord = ref(false)
const showAdministrationCostCreateForm = ref(false)
const showQualityEnhancementCreateForm = ref(false)
const isCreatingAdministrationCost = ref(false)
const isCreatingQualityEnhancement = ref(false)

async function loadWorksheet() {
  showAdministrationCostCreateForm.value = false
  showQualityEnhancementCreateForm.value = false
  showChildrenWithDiverseNeedsFundingRecordCreateForm.value = false
  isCreatingChildrenWithDiverseNeedsFundingRecord.value = false
  isCreatingAdministrationCost.value = false
  isCreatingQualityEnhancement.value = false
  const requestId = ++activeRequest
  isLoading.value = true
  loadError.value = false
  fundingSubmissionLineJson.value = null
  fiscalPeriod.value = null

  try {
    const [worksheetResult, fiscalPeriodResult] = await Promise.allSettled([
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

    if (worksheetResult.status === "rejected" || fiscalPeriodResult.status === "rejected") {
      const failures = [worksheetResult, fiscalPeriodResult].flatMap((result) =>
        result.status === "rejected" ? [result.reason] : []
      )
      throw new AggregateError(failures, failures.map(String).join("; "))
    }

    const worksheetResponse = worksheetResult.value
    const fiscalPeriodResponse = fiscalPeriodResult.value

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
      loadError.value = true
    }

    rethrowUnexpectedError(error)
    if (requestId === activeRequest) {
      console.error(`Failed to load worksheet: ${error}`, { error })
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

const worksheetWhere = computed(() => ({
  centreId: props.centreId,
  fiscalPeriodId: fiscalPeriod.value?.id,
}))
const childrenWithDiverseNeedsFundingRecordTable = useTemplateRef<
  InstanceType<typeof ChildrenWithDiverseNeedsFundingRecordEditTable>
>("childrenWithDiverseNeedsFundingRecordTable")
const administrationCostTable =
  useTemplateRef<InstanceType<typeof AdministrationCostEditTable>>("administrationCostTable")
const qualityEnhancementTable =
  useTemplateRef<InstanceType<typeof QualityEnhancementEditTable>>("qualityEnhancementTable")
const jsonSheet =
  useTemplateRef<InstanceType<typeof FundingSubmissionLineJsonEditSheet>>("jsonSheet")
const buildingExpensesEditTable = useTemplateRef("buildingExpensesEditTable")
const keyboardShortcutsModal = useTemplateRef("keyboardShortcutsModal")
const showBuildingExpenseCreateForm = ref(false)
const isReplicating = ref(false)
const isWorksheetSaving = ref(false)
const isRefreshingLinked = ref(false)
const snack = useSnack()
const isLedgerMutating = computed(() =>
  Boolean(
    childrenWithDiverseNeedsFundingRecordTable.value?.isSaving ||
      childrenWithDiverseNeedsFundingRecordTable.value?.isDeleting ||
      administrationCostTable.value?.isSaving ||
      administrationCostTable.value?.isDeleting ||
      qualityEnhancementTable.value?.isSaving ||
      qualityEnhancementTable.value?.isDeleting ||
      isCreatingChildrenWithDiverseNeedsFundingRecord.value ||
      isCreatingAdministrationCost.value ||
      isCreatingQualityEnhancement.value
  )
)
const isWorkflowBusy = computed(
  () =>
    isReplicating.value ||
    isWorksheetSaving.value ||
    isLedgerMutating.value ||
    isRefreshingLinked.value
)
const isReplicationUnavailable = computed(() => {
  const sheet = jsonSheet.value
  const administration = administrationCostTable.value
  const childrenWithDiverseNeedsFundingRecord = childrenWithDiverseNeedsFundingRecordTable.value
  const quality = qualityEnhancementTable.value
  return (
    !sheet ||
    sheet.isLoading ||
    sheet.isErrored ||
    !childrenWithDiverseNeedsFundingRecord ||
    childrenWithDiverseNeedsFundingRecord.isLoading ||
    childrenWithDiverseNeedsFundingRecord.isErrored ||
    !administration ||
    administration.isLoading ||
    administration.isErrored ||
    !quality ||
    quality.isLoading ||
    quality.isErrored
  )
})

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

async function refreshLinkedResources() {
  const results = await Promise.allSettled([
    administrationCostTable.value?.refresh(),
    childrenWithDiverseNeedsFundingRecordTable.value?.refresh(),
    qualityEnhancementTable.value?.refresh(),
  ])
  const failures = results.flatMap((result) =>
    result.status === "rejected" ? [result.reason] : []
  )
  if (failures.length > 0) throw new AggregateError(failures, failures.map(String).join("; "))
}

function onJsonUpdated(fundingSubmissionLineJsonId: number) {
  if (fundingSubmissionLineJson.value?.id !== fundingSubmissionLineJsonId) return

  emit("update:fundingSubmissionLineJson", fundingSubmissionLineJsonId)
}

async function saveWorksheet(): Promise<boolean> {
  if (isWorkflowBusy.value || isReplicationUnavailable.value) return false

  const sheet = jsonSheet.value
  const administration = administrationCostTable.value
  const childrenWithDiverseNeedsFundingRecord = childrenWithDiverseNeedsFundingRecordTable.value
  const quality = qualityEnhancementTable.value
  if (!sheet || !administration || !childrenWithDiverseNeedsFundingRecord || !quality) return false

  try {
    isWorksheetSaving.value = true
    const [
      administrationCommitted,
      childrenWithDiverseNeedsFundingRecordCommitted,
      qualityCommitted,
    ] = await Promise.all([
      administration.commitEdit(),
      childrenWithDiverseNeedsFundingRecord.commitEdit(),
      quality.commitEdit(),
    ])
    if (
      !administrationCommitted ||
      !childrenWithDiverseNeedsFundingRecordCommitted ||
      !qualityCommitted
    )
      return false

    const wasSaved = await sheet.saveFundingSubmissionLineJson()
    isRefreshingLinked.value = true
    try {
      await refreshLinkedResources()
    } finally {
      isRefreshingLinked.value = false
    }
    return wasSaved
  } catch (error) {
    rethrowUnexpectedError(error)

    snack.error(`Failed to save worksheet: ${error}`)
    return false
  } finally {
    isWorksheetSaving.value = false
  }
}

async function onAdministrationCostCreated() {
  showAdministrationCostCreateForm.value = false
  try {
    await administrationCostTable.value?.refresh()
  } catch (error) {
    rethrowUnexpectedError(error)

    snack.error(`Failed to refresh administration costs: ${error}`)
  }
}

async function onChildrenWithDiverseNeedsFundingRecordCreated() {
  showChildrenWithDiverseNeedsFundingRecordCreateForm.value = false
  try {
    await childrenWithDiverseNeedsFundingRecordTable.value?.refresh()
  } catch (error) {
    snack.error(`Failed to refresh diverse needs: ${error}`)
  }
}

async function onQualityEnhancementCreated() {
  showQualityEnhancementCreateForm.value = false
  try {
    await qualityEnhancementTable.value?.refresh()
  } catch (error) {
    rethrowUnexpectedError(error)

    snack.error(`Failed to refresh Quality Enhancements: ${error}`)
  }
}

async function replicateEstimatesForward() {
  const context = {
    centreId: props.centreId,
    fiscalPeriodId: fiscalPeriod.value?.id,
    worksheetId: fundingSubmissionLineJson.value?.id,
  }
  if (
    isNil(context.fiscalPeriodId) ||
    isNil(context.worksheetId) ||
    isWorkflowBusy.value ||
    isReplicationUnavailable.value
  ) {
    return
  }

  const sheet = jsonSheet.value
  const administration = administrationCostTable.value
  const childrenWithDiverseNeedsFundingRecord = childrenWithDiverseNeedsFundingRecordTable.value
  const quality = qualityEnhancementTable.value
  if (!sheet || !administration || !childrenWithDiverseNeedsFundingRecord || !quality) return

  const savedWorksheet = saveWorksheet()
  isReplicating.value = true
  try {
    if (!(await savedWorksheet)) return

    if (
      props.centreId !== context.centreId ||
      fiscalPeriod.value?.id !== context.fiscalPeriodId ||
      fundingSubmissionLineJson.value?.id !== context.worksheetId
    ) {
      return
    }

    const results = await Promise.allSettled([
      sheet.replicateOwnEstimates(),
      administration.replicateEstimates(),
      childrenWithDiverseNeedsFundingRecord.replicateEstimates(),
      quality.replicateEstimates(),
    ])
    const failures = results.flatMap((result) =>
      result.status === "rejected" ? [result.reason] : []
    )
    if (failures.length > 0) throw new AggregateError(failures, failures.map(String).join("; "))

    snack.success("Estimates replicated successfully!")
  } catch (error) {
    rethrowUnexpectedError(error)

    snack.error(`Failed to replicate estimates: ${error}`)
  } finally {
    isReplicating.value = false
  }
}
</script>
