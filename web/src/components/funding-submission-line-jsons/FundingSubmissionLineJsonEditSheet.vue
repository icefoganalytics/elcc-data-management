<template>
  <v-sheet @keydown="activateKeyboardShortcutsModalIfCorrectEvent($event)">
    <slot
      name="actions"
      :is-saving="isSaving"
      :workflow-busy="workflowBusy"
    >
      <v-btn
        color="primary"
        class="float-right"
        :loading="isSaving"
        :disabled="isSaving || workflowBusy || isLoading || isErrored"
        @click="saveFundingSubmissionLineJson"
      >
        Save
      </v-btn>
    </slot>

    <h2 class="mb-3">{{ dateName }} {{ calendarYear }}</h2>

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

    <template
      v-for="({ sectionName, lines }, sectionIndex) in sections"
      :key="`${sectionName}-${sectionIndex}`"
    >
      <section v-if="!isLoading && !isErrored">
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
    </template>
    <KeyboardShortcutsModal ref="keyboardShortcutsModal" />
  </v-sheet>
</template>

<script setup lang="ts">
import { DateTime } from "luxon"
import { computed, reactive, ref, toRefs } from "vue"
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

const props = withDefaults(
  defineProps<{
    fundingSubmissionLineJsonId: number
    centreId: number
    fiscalPeriodId: number
    workflowBusy?: boolean
  }>(),
  { workflowBusy: false }
)

const emit = defineEmits<{
  "update:fundingSubmissionLineJson": [fundingSubmissionLineJsonId: number]
  saving: [value: boolean]
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
const isLoading = computed(
  () => isLoadingFundingSubmissionLineJson.value || isLoadingChildCareSpaces.value
)
const isErrored = computed(
  () =>
    isErroredFundingSubmissionLineJson.value ||
    isErroredChildCareSpaces.value ||
    isNil(fundingSubmissionLineJson.value)
)

const isSaving = ref(false)
const isWorkflowRunning = computed(() => isSaving.value || props.workflowBusy)
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

const sections = computed<{ sectionName: string; lines: FundingLineValue[] }[]>(() => {
  const sectionGroups = groupBy(fundingSubmissionLineJson.value?.lines ?? [], "sectionName")
  return [
    {
      sectionName: CHILD_CARE_SPACES_SECTION_NAME,
      lines: childCareSpacesAsFundingLineValues.value,
    },
    ...Object.entries(sectionGroups).map(([sectionName, lines]) => ({ sectionName, lines })),
  ]
})
const fundingSubmissionLineJsonSectionTables = ref<
  InstanceType<typeof FundingSubmissionLineJsonSectionTable>[]
>([])
const notificationStore = useNotificationStore()

async function reloadWorksheet() {
  try {
    await Promise.all([refreshChildCareSpaces(), refreshFundingSubmissionLineJson()])
  } catch (error) {
    notificationStore.notify({
      text: `Failed to load worksheet: ${error}`,
      variant: "error",
    })
  }
}

async function saveFundingSubmissionLineJson(): Promise<boolean> {
  if (isSaving.value || isLoading.value || isErrored.value) {
    return false
  }

  isSaving.value = true
  emit("saving", true)
  try {
    const childCareSpaceLines = sections.value.find(
      ({ sectionName }) => sectionName === CHILD_CARE_SPACES_SECTION_NAME
    )?.lines
    const childCareSpacesByCategoryId = new Map(
      childCareSpaces.value.map((childCareSpace) => [childCareSpace.categoryId, childCareSpace])
    )
    const childCareSpaceUpdates = []

    for (const line of childCareSpaceLines ?? []) {
      const childCareSpace = childCareSpacesByCategoryId.get(line.submissionLineId)
      if (isNil(childCareSpace)) {
        throw new Error(`Child Care Space for category ${line.submissionLineId} is missing`)
      }
      if (
        childCareSpace.estimatedChildOccupancyRate === line.estimatedChildOccupancyRate &&
        childCareSpace.actualChildOccupancyRate === line.actualChildOccupancyRate
      )
        continue
      childCareSpaceUpdates.push({
        id: childCareSpace.id,
        update: {
          estimatedChildOccupancyRate: line.estimatedChildOccupancyRate,
          actualChildOccupancyRate: line.actualChildOccupancyRate,
        },
      })
    }

    const jsonLines = sections.value
      .filter(({ sectionName }) => sectionName !== CHILD_CARE_SPACES_SECTION_NAME)
      .flatMap(({ lines }) => lines)
    const mutations = childCareSpaceUpdates.map(({ id, update }) =>
      childCareSpacesApi.update(id, update)
    )
    await awaitMutationSettlements(mutations)
    await fundingSubmissionLineJsonsApi.update(fundingSubmissionLineJsonId.value, {
      lines: jsonLines,
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
    emit("saving", false)
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

async function replicateOwnEstimates(): Promise<void> {
  await awaitMutationSettlements([
    fundingSubmissionLineJsonsApi.replicateEstimates(fundingSubmissionLineJsonId.value),
    replicateChildCareSpaceEstimates(),
  ])
  await Promise.all([refreshChildCareSpaces(), refreshFundingSubmissionLineJson()])
  emit("update:fundingSubmissionLineJson", fundingSubmissionLineJsonId.value)
}

async function replicateChildCareSpaceEstimates(): Promise<void> {
  for (const childCareSpace of childCareSpaces.value) {
    await childCareSpacesApi.replicateEstimates(childCareSpace.id)
  }
}

function propagateUpdatesAsNeeded({ line }: { line: FundingLineValue }) {
  if (line.sectionName !== CHILD_CARE_SPACES_SECTION_NAME) return

  const sectionIndex = sections.value.findIndex(
    ({ sectionName }) => sectionName === "Quality Enhancement Program"
  )
  if (sectionIndex === -1) return

  const linkedSection = sections.value[sectionIndex]
  const linkedTable = fundingSubmissionLineJsonSectionTables.value[sectionIndex]
  if (isNil(linkedTable)) return

  for (const linkedLine of linkedSection.lines) {
    if (linkedLine.childCareSpaceCategoryId !== line.submissionLineId) continue

    linkedLine.estimatedChildOccupancyRate = line.estimatedChildOccupancyRate
    linkedLine.actualChildOccupancyRate = line.actualChildOccupancyRate
    linkedTable.refreshLineTotals(linkedLine)
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
defineExpose({
  saveFundingSubmissionLineJson,
  replicateOwnEstimates,
  isLoading,
  isErrored,
})
</script>
