<template>
  <v-skeleton-loader
    v-if="isLoading"
    type="table"
  />
  <v-sheet
    v-else
    @keydown="activateKeyboardShortcutsModalIfCorrectEvent($event)"
  >
    <v-btn
      color="primary"
      class="float-right"
      :loading="isSaving"
      @click="saveFundingSubmissionLineJson"
      >Save</v-btn
    >

    <h2 class="mb-3">{{ dateName }} {{ calendarYear }}</h2>
    <div class="d-flex justify-end">
      <v-btn
        v-if="dateName == FIRST_FISCAL_MONTH_NAME"
        :loading="isReplicatingEstimates"
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
        @focus-beyond-last-in-column="goToNextSection(sectionIndex, $event)"
        @focus-beyond-first-in-column="goToPreviousSection(sectionIndex, $event)"
        @line-changed="propagateUpdatesAsNeeded($event)"
      />
    </section>
    <KeyboardShortcutsModal ref="keyboardShortcutsModal" />
  </v-sheet>
</template>

<script setup lang="ts">
import { DateTime } from "luxon"
import { computed, ref, toRefs } from "vue"
import { groupBy, isNil } from "lodash"

import childCareSpacesApi, { CHILD_CARE_SPACES_SECTION_NAME } from "@/api/child-care-spaces-api"
import fundingSubmissionLineJsonsApi, {
  type FundingLineValue,
} from "@/api/funding-submission-line-jsons-api"
import { useNotificationStore } from "@/store/NotificationStore"
import useChildCareSpaces from "@/use/use-child-care-spaces"
import useFundingSubmissionLineJson from "@/use/use-funding-submission-line-json"

import KeyboardShortcutsModal from "@/components/common/KeyboardShortcutsModal.vue"
import FundingSubmissionLineJsonSectionTable, {
  type ColumnNames,
} from "@/components/funding-submission-line-jsons/FundingSubmissionLineJsonSectionTable.vue"

const FIRST_FISCAL_MONTH_NAME = "April"
const LINKED_SECTION_NAMES = ["Administration (10% of Spaces)", "Quality Enhancement Program"]

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
  refresh: refreshChildCareSpaces,
} = useChildCareSpaces(childCareSpacesQuery)

const isLoading = computed(
  () => isLoadingFundingSubmissionLineJson.value || isLoadingChildCareSpaces.value
)
const isSaving = ref(false)
const isReplicatingEstimates = ref(false)
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
    return {
      submissionLineId: childCareSpace.fundingSubmissionLineId,
      sectionName: CHILD_CARE_SPACES_SECTION_NAME,
      lineName: childCareSpace.lineName,
      monthlyAmount: childCareSpace.monthlyAmount,
      estimatedChildOccupancyRate: childCareSpace.estimatedChildOccupancyRate,
      actualChildOccupancyRate: childCareSpace.actualChildOccupancyRate,
      estimatedComputedTotal: childCareSpace.estimatedComputedTotal,
      actualComputedTotal: childCareSpace.actualComputedTotal,
    }
  })
})
const sections = computed<{ sectionName: string; lines: FundingLineValue[] }[]>(() => {
  if (isNil(fundingSubmissionLineJson.value)) {
    return []
  }

  const lines = [
    ...childCareSpacesAsFundingLineValues.value,
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

async function saveFundingSubmissionLineJson(): Promise<boolean> {
  isSaving.value = true
  try {
    const childCareSpaceLines = sections.value.find(
      ({ sectionName }) => sectionName === CHILD_CARE_SPACES_SECTION_NAME
    )?.lines
    const childCareSpacesByFundingSubmissionLineId = new Map(
      childCareSpaces.value.map((childCareSpace) => {
        return [childCareSpace.fundingSubmissionLineId, childCareSpace]
      })
    )
    const childCareSpaceUpdates = []

    for (const childCareSpaceLine of childCareSpaceLines ?? []) {
      const childCareSpace = childCareSpacesByFundingSubmissionLineId.get(
        childCareSpaceLine.submissionLineId
      )
      if (isNil(childCareSpace)) {
        throw new Error(
          `Child Care Space for funding submission line ${childCareSpaceLine.submissionLineId} is missing`
        )
      }

      const isUnchanged =
        childCareSpace.estimatedChildOccupancyRate ===
          childCareSpaceLine.estimatedChildOccupancyRate &&
        childCareSpace.actualChildOccupancyRate === childCareSpaceLine.actualChildOccupancyRate
      if (isUnchanged) continue

      childCareSpaceUpdates.push(
        childCareSpacesApi.update(childCareSpace.id, {
          estimatedChildOccupancyRate: childCareSpaceLine.estimatedChildOccupancyRate,
          actualChildOccupancyRate: childCareSpaceLine.actualChildOccupancyRate,
        })
      )
    }
    const fundingSubmissionLineJsonLines = sections.value
      .filter(({ sectionName }) => sectionName !== CHILD_CARE_SPACES_SECTION_NAME)
      .flatMap(({ lines }) => lines)

    await Promise.all(childCareSpaceUpdates)
    await fundingSubmissionLineJsonsApi.update(fundingSubmissionLineJsonId.value, {
      lines: fundingSubmissionLineJsonLines,
    })
    await Promise.all([refreshChildCareSpaces(), refreshFundingSubmissionLineJson()])

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

async function replicateEstimatesForward() {
  isReplicatingEstimates.value = true
  try {
    const wasSaved = await saveFundingSubmissionLineJson()
    if (!wasSaved) return

    await Promise.all([
      fundingSubmissionLineJsonsApi.replicateEstimates(fundingSubmissionLineJsonId.value),
      ...childCareSpaces.value.map((childCareSpace) =>
        childCareSpacesApi.replicateEstimates(childCareSpace.id)
      ),
    ])
    await Promise.all([refreshChildCareSpaces(), refreshFundingSubmissionLineJson()])

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

function propagateUpdatesAsNeeded({ line }: { line: FundingLineValue }) {
  if (line.sectionName !== CHILD_CARE_SPACES_SECTION_NAME) return

  try {
    for (const linkedSectionName of LINKED_SECTION_NAMES) {
      const linkedSectionIndex = sections.value.findIndex(
        ({ sectionName }) => sectionName === linkedSectionName
      )
      if (linkedSectionIndex === -1) {
        throw new Error(`Expected "${linkedSectionName}" section`)
      }

      const linkedSection = sections.value[linkedSectionIndex]
      const matchingLines = linkedSection.lines.filter(({ lineName }) => lineName === line.lineName)
      if (matchingLines.length !== 1) {
        throw new Error(
          `Expected one "${line.lineName}" line in "${linkedSectionName}", found ${matchingLines.length}`
        )
      }

      const linkedLine = matchingLines[0]
      linkedLine.estimatedChildOccupancyRate = line.estimatedChildOccupancyRate
      linkedLine.actualChildOccupancyRate = line.actualChildOccupancyRate

      const linkedSectionTable = fundingSubmissionLineJsonSectionTables.value[linkedSectionIndex]
      if (isNil(linkedSectionTable)) {
        throw new Error(`Expected "${linkedSectionName}" section table`)
      }

      linkedSectionTable.refreshLineTotals(linkedLine)
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
    if (isNil(nextSection)) return

    nextSection.focusOnFirstInColumn(columnName)
  }
}

function goToPreviousSection(sectionIndex: number, columnName: ColumnNames) {
  if (sectionIndex > 0) {
    const previousIndex = sectionIndex - 1
    const previousSection = fundingSubmissionLineJsonSectionTables.value[previousIndex]
    if (isNil(previousSection)) return

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
  if (isNil(keyboardShortcutsModal.value)) return

  keyboardShortcutsModal.value.open()
}
</script>
