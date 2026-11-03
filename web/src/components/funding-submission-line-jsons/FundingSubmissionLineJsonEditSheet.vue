<template>
  <v-sheet @keydown="activateKeyboardShortcutsModalIfCorrectEvent($event)">
    <div class="d-flex flex-wrap align-center ga-2 mb-3">
      <h2>{{ dateName }} {{ calendarYear }}</h2>

      <div class="ml-auto">
        <slot
          name="actions"
          :is-saving="isSaving"
          :is-workflow-busy="isWorkflowBusy"
        />
      </div>
    </div>

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
          @line-changed="onLineChanged"
        />
        <div class="d-flex justify-end mt-3">
          <slot name="section-actions">
            <v-btn
              color="primary"
              :loading="isSaving"
              :disabled="isSaving || isWorkflowBusy || isLoading || isErrored"
              @click="saveFundingSubmissionLineJson"
            >
              Save
            </v-btn>
          </slot>
        </div>
      </section>
    </template>
    <KeyboardShortcutsModal ref="keyboardShortcutsModal" />
  </v-sheet>
</template>

<script setup lang="ts">
import { DateTime } from "luxon"
import { computed, reactive, ref, toRefs, useTemplateRef } from "vue"
import { groupBy, isNil } from "lodash"
import Big from "big.js"
import { formatDecimal } from "@/utils/formatters"

import childCareSpacesApi, { CHILD_CARE_SPACES_SECTION_NAME } from "@/api/child-care-spaces-api"
import rethrowUnexpectedError from "@/api/errors/rethrow-unexpected-error"
import fundingSubmissionLineJsonsApi, {
  type FundingLineValue,
} from "@/api/funding-submission-line-jsons-api"
import useChildCareSpaces from "@/use/use-child-care-spaces"
import useFundingSubmissionLineJson from "@/use/use-funding-submission-line-json"
import useSnack from "@/use/use-snack"

import KeyboardShortcutsModal from "@/components/common/KeyboardShortcutsModal.vue"
import FundingSubmissionLineJsonSectionTable, {
  type ColumnNames,
} from "@/components/funding-submission-line-jsons/FundingSubmissionLineJsonSectionTable.vue"

const props = withDefaults(
  defineProps<{
    fundingSubmissionLineJsonId: number
    centreId: number
    fiscalPeriodId: number
    isWorkflowBusy?: boolean
  }>(),
  {
    isWorkflowBusy: false,
  }
)

const emit = defineEmits<{
  "update:fundingSubmissionLineJson": [fundingSubmissionLineJsonId: number]
  childCareSpaceChanged: [line: FundingLineValue]
  saving: [value: boolean]
  focusBeyondLastInColumn: [column: ColumnNames]
  focusBeyondFirstInColumn: [column: ColumnNames]
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
const isWorkflowRunning = computed(() => isSaving.value || props.isWorkflowBusy)
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
      estimatedChildOccupancyRate: formatDecimal(childCareSpace.estimatedChildOccupancyRate),
      actualChildOccupancyRate: formatDecimal(childCareSpace.actualChildOccupancyRate),
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
const fundingSubmissionLineJsonSectionTables = useTemplateRef<
  InstanceType<typeof FundingSubmissionLineJsonSectionTable>[]
>("fundingSubmissionLineJsonSectionTables")
const snack = useSnack()

async function reloadWorksheet() {
  try {
    await awaitRequestSettlements([refreshChildCareSpaces(), refreshFundingSubmissionLineJson()])
  } catch (error) {
    rethrowUnexpectedError(error)

    snack.error(`Failed to load worksheet: ${error}`)
  }
}

function onLineChanged({ line }: { line: FundingLineValue }) {
  if (line.sectionName === CHILD_CARE_SPACES_SECTION_NAME) {
    emit("childCareSpaceChanged", line)
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
        Big(childCareSpace.estimatedChildOccupancyRate).eq(line.estimatedChildOccupancyRate) &&
        Big(childCareSpace.actualChildOccupancyRate).eq(line.actualChildOccupancyRate)
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

    const jsonLines = sections.value
      .filter(({ sectionName }) => sectionName !== CHILD_CARE_SPACES_SECTION_NAME)
      .flatMap(({ lines }) => lines)
    const mutations = childCareSpaceUpdates.map(({ id, update }) =>
      childCareSpacesApi.update(id, update)
    )
    await awaitRequestSettlements(mutations)
    await fundingSubmissionLineJsonsApi.update(fundingSubmissionLineJsonId.value, {
      lines: jsonLines,
    })
    await awaitRequestSettlements([refreshChildCareSpaces(), refreshFundingSubmissionLineJson()])

    emit("update:fundingSubmissionLineJson", fundingSubmissionLineJsonId.value)
    return true
  } catch (error) {
    rethrowUnexpectedError(error)

    console.error(`Failed to save worksheet: ${error}`, { error })
    snack.error(`Failed to save worksheet: ${error}`)
    return false
  } finally {
    isSaving.value = false
    emit("saving", false)
  }
}

async function awaitRequestSettlements(requests: Promise<unknown>[]) {
  const results = await Promise.allSettled(requests)
  const failures = results.flatMap((result) =>
    result.status === "rejected" ? [result.reason] : []
  )

  if (failures.length > 0) {
    const error = new AggregateError(failures, failures.map(String).join("; "))
    rethrowUnexpectedError(error)
    throw error
  }
}

async function replicateOwnEstimates(): Promise<void> {
  await awaitRequestSettlements([
    fundingSubmissionLineJsonsApi.replicateEstimates(fundingSubmissionLineJsonId.value),
    replicateChildCareSpaceEstimates(),
  ])
  await awaitRequestSettlements([refreshChildCareSpaces(), refreshFundingSubmissionLineJson()])
  emit("update:fundingSubmissionLineJson", fundingSubmissionLineJsonId.value)
}

async function replicateChildCareSpaceEstimates(): Promise<void> {
  for (const childCareSpace of childCareSpaces.value) {
    await childCareSpacesApi.replicateEstimates(childCareSpace.id)
  }
}

function goToNextSection(sectionIndex: number, columnName: ColumnNames) {
  const sectionTables = fundingSubmissionLineJsonSectionTables.value
  if (isNil(sectionTables)) {
    emit("focusBeyondLastInColumn", columnName)
    return
  }

  for (let index = sectionIndex + 1; index < sectionTables.length; index++) {
    const nextSection = sectionTables[index]
    if (isNil(nextSection)) {
      continue
    }

    if (nextSection.focusOnFirstInColumn(columnName)) {
      return
    }
  }

  emit("focusBeyondLastInColumn", columnName)
}

function goToPreviousSection(sectionIndex: number, columnName: ColumnNames) {
  const sectionTables = fundingSubmissionLineJsonSectionTables.value
  if (isNil(sectionTables)) {
    emit("focusBeyondFirstInColumn", columnName)
    return
  }

  for (let index = sectionIndex - 1; index >= 0; index--) {
    const previousSection = sectionTables[index]
    if (isNil(previousSection)) {
      continue
    }

    if (previousSection.focusOnLastInColumn(columnName)) {
      return
    }
  }

  emit("focusBeyondFirstInColumn", columnName)
}

function focusOnFirstInColumn(columnName: ColumnNames): boolean {
  const sectionTables = fundingSubmissionLineJsonSectionTables.value
  if (isWorkflowRunning.value || isNil(sectionTables)) return false

  for (const section of sectionTables) {
    if (section.focusOnFirstInColumn(columnName)) return true
  }
  return false
}

function focusOnLastInColumn(columnName: ColumnNames): boolean {
  const sectionTables = fundingSubmissionLineJsonSectionTables.value
  if (isWorkflowRunning.value || isNil(sectionTables)) return false

  for (let index = sectionTables.length - 1; index >= 0; index--) {
    const section = sectionTables[index]
    if (isNil(section)) {
      continue
    }

    if (section.focusOnLastInColumn(columnName)) {
      return true
    }
  }
  return false
}

const keyboardShortcutsModal = useTemplateRef("keyboardShortcutsModal")

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
  focusOnFirstInColumn,
  focusOnLastInColumn,
  isLoading,
  isErrored,
  isWorkflowRunning,
})
</script>
