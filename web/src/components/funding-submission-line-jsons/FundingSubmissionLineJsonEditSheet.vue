<template>
  <v-sheet @keydown="activateKeyboardShortcutsModalIfCorrectEvent($event)">
    <v-skeleton-loader
      v-if="isLoading"
      type="table"
    />
    <v-alert
      v-else-if="isErrored"
      type="error"
      variant="tonal"
    >
      Worksheet data could not be loaded. Reload all sources before editing.
      <v-btn
        class="ml-3"
        variant="outlined"
        @click="reloadWorksheet"
      >
        Reload Worksheet
      </v-btn>
    </v-alert>
    <template v-else>
      <v-btn
        color="primary"
        class="float-right"
        :loading="isSaving"
        :disabled="isReplicatingEstimates"
        @click="saveFundingSubmissionLineJson"
      >
        Save
      </v-btn>

      <h2 class="mb-3">{{ dateName }} {{ calendarYear }}</h2>
      <div class="d-flex justify-end">
        <v-btn
          v-if="dateName == FIRST_FISCAL_MONTH_NAME"
          :loading="isReplicatingEstimates"
          :disabled="isSaving"
          color="yg-sun"
          size="small"
          @click="replicateEstimatesForward"
        >
          <v-icon>mdi-content-copy</v-icon> Replicate Estimates
        </v-btn>
      </div>

      <section
        v-for="({ sectionName, lines }, sectionIndex) in sections"
        :key="`${sectionName}-${sectionIndex}`"
      >
        <h3
          class="d-flex justify-space-between align-center mt-4 mb-2 ml-n2 pa-2 rounded bg-primary-lighten-2"
        >
          {{ sectionName }}

          <v-icon
            title="Show keyboard shortcuts"
            @click="showKeyboardShortcutsModal"
          >
            mdi-keyboard
          </v-icon>
        </h3>

        <FundingSubmissionLineJsonSectionTable
          ref="fundingSubmissionLineJsonSectionTables"
          :lines="lines"
          :readonly="isWorkflowRunning"
          @focus-beyond-last-in-column="goToNextSection(sectionIndex, $event)"
          @focus-beyond-first-in-column="goToPreviousSection(sectionIndex, $event)"
          @line-changed="propagateUpdatesAsNeeded($event)"
        />
      </section>
      <KeyboardShortcutsModal ref="keyboardShortcutsModal" />
    </template>
  </v-sheet>
</template>

<script setup lang="ts">
import { DateTime } from "luxon"
import { computed, reactive, ref, toRefs } from "vue"
import { groupBy, isNil } from "lodash"

import administrationCostsApi, { ADMINISTRATION_SECTION_NAME } from "@/api/administration-costs-api"
import childCareSpacesApi, { CHILD_CARE_SPACES_SECTION_NAME } from "@/api/child-care-spaces-api"
import fundingSubmissionLineJsonsApi, {
  type FundingLineValue,
} from "@/api/funding-submission-line-jsons-api"
import { useNotificationStore } from "@/store/NotificationStore"
import useAdministrationCosts from "@/use/use-administration-costs"
import useChildCareSpaces from "@/use/use-child-care-spaces"
import useFundingSubmissionLineJson from "@/use/use-funding-submission-line-json"

import KeyboardShortcutsModal from "@/components/common/KeyboardShortcutsModal.vue"
import FundingSubmissionLineJsonSectionTable, {
  type ColumnNames,
} from "@/components/funding-submission-line-jsons/FundingSubmissionLineJsonSectionTable.vue"

const FIRST_FISCAL_MONTH_NAME = "April"
const LINKED_SECTION_NAMES = [ADMINISTRATION_SECTION_NAME, "Quality Enhancement Program"]

const props = defineProps<{
  fundingSubmissionLineJsonId: number
  centreId: number
  fiscalPeriodId: number
}>()

const emit = defineEmits<{
  "update:fundingSubmissionLineJson": [fundingSubmissionLineJsonId: number]
}>()

const { fundingSubmissionLineJsonId } = toRefs(props)
const {
  fundingSubmissionLineJson,
  isLoading: isLoadingFundingSubmissionLineJson,
  isErrored: isErroredFundingSubmissionLineJson,
  refresh: refreshFundingSubmissionLineJson,
} = useFundingSubmissionLineJson(fundingSubmissionLineJsonId)
const childCareSpacesQuery = computed(() => ({
  where: {
    centreId: props.centreId,
    fiscalPeriodId: props.fiscalPeriodId,
  },
  perPage: -1,
}))
const {
  childCareSpaces,
  isLoading: isLoadingChildCareSpaces,
  isErrored: isErroredChildCareSpaces,
  refresh: refreshChildCareSpaces,
} = useChildCareSpaces(childCareSpacesQuery)
const administrationCostsQuery = computed(() => ({
  where: {
    centreId: props.centreId,
    fiscalPeriodId: props.fiscalPeriodId,
  },
  perPage: -1,
}))
const {
  administrationCosts,
  isLoading: isLoadingAdministrationCosts,
  isErrored: isErroredAdministrationCosts,
  fetch: refreshAdministrationCosts,
} = useAdministrationCosts(administrationCostsQuery)

const isLoading = computed(
  () =>
    isLoadingFundingSubmissionLineJson.value ||
    isLoadingChildCareSpaces.value ||
    isLoadingAdministrationCosts.value
)
const isErrored = computed(
  () =>
    isErroredFundingSubmissionLineJson.value ||
    isErroredChildCareSpaces.value ||
    isErroredAdministrationCosts.value ||
    isNil(fundingSubmissionLineJson.value)
)

const isSaving = ref(false)
const isReplicatingEstimates = ref(false)
const isWorkflowRunning = computed(() => isSaving.value || isReplicatingEstimates.value)
const dateName = computed(() => fundingSubmissionLineJson.value?.dateName)
const calendarYear = computed(() => {
  if (isNil(fundingSubmissionLineJson.value)) {
    return "..."
  }

  const { dateStart } = fundingSubmissionLineJson.value
  return DateTime.fromISO(dateStart).toFormat("yyyy")
})

const childCareSpacesAsFundingLineValues = computed<FundingLineValue[]>(() => {
  return childCareSpaces.value.map((childCareSpace) => {
    const submissionLineId = childCareSpace.categoryId

    return reactive({
      submissionLineId,
      sectionName: CHILD_CARE_SPACES_SECTION_NAME,
      lineName: childCareSpace.lineName,
      monthlyAmount: childCareSpace.monthlyAmount,
      estimatedChildOccupancyRate: childCareSpace.estimatedChildOccupancyRate,
      actualChildOccupancyRate: childCareSpace.actualChildOccupancyRate,
      estimatedComputedTotal: childCareSpace.estimatedComputedTotal,
      actualComputedTotal: childCareSpace.actualComputedTotal,
    })
  })
})
const administrationCostsAsFundingLineValues = computed<FundingLineValue[]>(() =>
  administrationCosts.value.map((cost) =>
    reactive({
      submissionLineId: cost.categoryId,
      childCareSpaceCategoryId: cost.childCareSpaceCategoryId ?? undefined,
      sectionName: ADMINISTRATION_SECTION_NAME,
      lineName: cost.lineName,
      monthlyAmount: cost.monthlyAmount,
      estimatedChildOccupancyRate: cost.estimatedChildOccupancyRate,
      actualChildOccupancyRate: cost.actualChildOccupancyRate,
      estimatedComputedTotal: cost.estimatedComputedTotal,
      actualComputedTotal: cost.actualComputedTotal,
    })
  )
)
const sections = computed<{ sectionName: string; lines: FundingLineValue[] }[]>(() => {
  if (isNil(fundingSubmissionLineJson.value)) {
    return []
  }

  const lines = [
    ...childCareSpacesAsFundingLineValues.value,
    ...administrationCostsAsFundingLineValues.value,
    ...fundingSubmissionLineJson.value.lines,
  ]
  const sectionGroups = groupBy(lines, "sectionName")
  return Object.entries(sectionGroups).map(([sectionName, lines]) => {
    return { sectionName, lines }
  })
})
const fundingSubmissionLineJsonSectionTables = ref<
  InstanceType<typeof FundingSubmissionLineJsonSectionTable>[]
>([])
const notificationStore = useNotificationStore()

async function reloadWorksheet() {
  try {
    await Promise.all([
      refreshChildCareSpaces(),
      refreshAdministrationCosts(),
      refreshFundingSubmissionLineJson(),
    ])
  } catch (error) {
    notificationStore.notify({
      text: `Failed to load worksheet: ${error}`,
      variant: "error",
    })
  }
}

async function saveFundingSubmissionLineJson(): Promise<boolean> {
  if (isLoading.value || isErrored.value) {
    return false
  }

  isSaving.value = true
  try {
    const childCareSpaceLines = sections.value.find(
      ({ sectionName }) => sectionName === CHILD_CARE_SPACES_SECTION_NAME
    )?.lines
    const childCareSpacesByCategoryId = new Map(
      childCareSpaces.value.map((childCareSpace) => [childCareSpace.categoryId, childCareSpace])
    )
    const administrationCostsByCategoryId = new Map(
      administrationCosts.value.map((cost) => [cost.categoryId, cost])
    )
    const childCareSpaceUpdates = []
    const administrationCostUpdates = []

    for (const line of childCareSpaceLines ?? []) {
      const childCareSpace = childCareSpacesByCategoryId.get(line.submissionLineId)
      if (isNil(childCareSpace)) {
        throw new Error(`Child Care Space for category ${line.submissionLineId} is missing`)
      }

      if (
        childCareSpace.estimatedChildOccupancyRate === line.estimatedChildOccupancyRate &&
        childCareSpace.actualChildOccupancyRate === line.actualChildOccupancyRate
      ) {
        continue
      }

      childCareSpaceUpdates.push({
        id: childCareSpace.id,
        update: {
          estimatedChildOccupancyRate: line.estimatedChildOccupancyRate,
          actualChildOccupancyRate: line.actualChildOccupancyRate,
        },
      })
    }

    const administrationLines = sections.value.find(
      ({ sectionName }) => sectionName === ADMINISTRATION_SECTION_NAME
    )?.lines
    for (const line of administrationLines ?? []) {
      const cost = administrationCostsByCategoryId.get(line.submissionLineId)
      if (
        isNil(cost) ||
        (line.childCareSpaceCategoryId ?? null) !== cost.childCareSpaceCategoryId
      ) {
        throw new Error(`Administration category ${line.submissionLineId} has mismatched identity`)
      }

      if (
        cost.estimatedChildOccupancyRate === line.estimatedChildOccupancyRate &&
        cost.actualChildOccupancyRate === line.actualChildOccupancyRate
      ) {
        continue
      }

      administrationCostUpdates.push({
        id: cost.id,
        update: {
          estimatedChildOccupancyRate: line.estimatedChildOccupancyRate,
          actualChildOccupancyRate: line.actualChildOccupancyRate,
        },
      })
    }

    const linesInOtherSections = sections.value.filter(
      ({ sectionName }) =>
        sectionName !== CHILD_CARE_SPACES_SECTION_NAME &&
        sectionName !== ADMINISTRATION_SECTION_NAME
    )
    const fundingSubmissionLineJsonLines = linesInOtherSections.flatMap(({ lines }) => lines)
    const ledgerRequests = [
      ...childCareSpaceUpdates.map(({ id, update }) => childCareSpacesApi.update(id, update)),
      ...administrationCostUpdates.map(({ id, update }) =>
        administrationCostsApi.update(id, update)
      ),
    ]
    await awaitMutationSettlements(ledgerRequests)
    await fundingSubmissionLineJsonsApi.update(fundingSubmissionLineJsonId.value, {
      lines: fundingSubmissionLineJsonLines,
    })
    await Promise.all([
      refreshChildCareSpaces(),
      refreshAdministrationCosts(),
      refreshFundingSubmissionLineJson(),
    ])

    emit("update:fundingSubmissionLineJson", fundingSubmissionLineJsonId.value)
    return true
  } catch (error) {
    console.error(error)
    notificationStore.notify({
      text: `Failed to save worksheet: ${error}`,
      variant: "error",
    })
    return false
  } finally {
    isSaving.value = false
  }
}

async function awaitMutationSettlements(mutations: Promise<unknown>[]) {
  const results = await Promise.allSettled(mutations)
  const failures = results.flatMap((result) =>
    result.status === "rejected" ? [result.reason] : []
  )

  if (failures.length > 0) {
    throw new AggregateError(failures, failures.map(String).join("; "))
  }
}

async function replicateEstimatesForward() {
  isReplicatingEstimates.value = true
  try {
    const wasSaved = await saveFundingSubmissionLineJson()
    if (!wasSaved) {
      return
    }

    const replicationRequests = [
      fundingSubmissionLineJsonsApi.replicateEstimates(fundingSubmissionLineJsonId.value),
      replicateChildCareSpaceEstimates(),
      replicateAdministrationCostEstimates(),
    ]
    await awaitMutationSettlements(replicationRequests)
    await Promise.all([
      refreshChildCareSpaces(),
      refreshAdministrationCosts(),
      refreshFundingSubmissionLineJson(),
    ])

    emit("update:fundingSubmissionLineJson", fundingSubmissionLineJsonId.value)
  } catch (error) {
    notificationStore.notify({
      text: `Failed to replicate estimates: ${error}`,
      variant: "error",
    })
  } finally {
    isReplicatingEstimates.value = false
  }
}

async function replicateChildCareSpaceEstimates() {
  for (const childCareSpace of childCareSpaces.value) {
    await childCareSpacesApi.replicateEstimates(childCareSpace.id)
  }
}

async function replicateAdministrationCostEstimates() {
  for (const administrationCost of administrationCosts.value) {
    await administrationCostsApi.replicateEstimates(administrationCost.id)
  }
}

function propagateUpdatesAsNeeded({ line }: { line: FundingLineValue }) {
  if (line.sectionName !== CHILD_CARE_SPACES_SECTION_NAME) {
    return
  }

  try {
    for (const linkedSectionName of LINKED_SECTION_NAMES) {
      const linkedSectionIndex = sections.value.findIndex(
        ({ sectionName }) => sectionName === linkedSectionName
      )
      if (linkedSectionIndex === -1) {
        continue
      }

      const linkedSection = sections.value[linkedSectionIndex]
      const matchingLines = linkedSection.lines.filter(
        ({ childCareSpaceCategoryId }) => childCareSpaceCategoryId === line.submissionLineId
      )
      if (matchingLines.length === 0) {
        continue
      }

      const linkedSectionTable = fundingSubmissionLineJsonSectionTables.value[linkedSectionIndex]
      if (isNil(linkedSectionTable)) {
        throw new Error(`Expected "${linkedSectionName}" section table`)
      }

      for (const linkedLine of matchingLines) {
        linkedLine.estimatedChildOccupancyRate = line.estimatedChildOccupancyRate
        linkedLine.actualChildOccupancyRate = line.actualChildOccupancyRate
        linkedSectionTable.refreshLineTotals(linkedLine)
      }
    }
  } catch (error) {
    notificationStore.notify({
      text: `Failed to propagate Child Care Spaces values: ${error}`,
      variant: "error",
    })
    throw error
  }
}

function goToNextSection(sectionIndex: number, columnName: ColumnNames) {
  if (sectionIndex < sections.value.length - 1) {
    const nextIndex = sectionIndex + 1
    const nextSection = fundingSubmissionLineJsonSectionTables.value[nextIndex]
    if (isNil(nextSection)) {
      return
    }

    nextSection.focusOnFirstInColumn(columnName)
  }
}

function goToPreviousSection(sectionIndex: number, columnName: ColumnNames) {
  if (sectionIndex > 0) {
    const previousIndex = sectionIndex - 1
    const previousSection = fundingSubmissionLineJsonSectionTables.value[previousIndex]
    if (isNil(previousSection)) {
      return
    }

    previousSection.focusOnLastInColumn(columnName)
  }
}

const keyboardShortcutsModal = ref<InstanceType<typeof KeyboardShortcutsModal> | null>(null)

function activateKeyboardShortcutsModalIfCorrectEvent(event: KeyboardEvent) {
  if (event.shiftKey && event.key === "?") {
    showKeyboardShortcutsModal()
  }
}

function showKeyboardShortcutsModal() {
  if (isNil(keyboardShortcutsModal.value)) {
    return
  }

  keyboardShortcutsModal.value.open()
}
</script>
