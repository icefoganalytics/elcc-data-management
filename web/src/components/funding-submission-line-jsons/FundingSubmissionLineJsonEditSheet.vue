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
import { computed, ref, toRefs, useTemplateRef } from "vue"
import { groupBy, isNil } from "lodash"
import rethrowUnexpectedError from "@/api/errors/rethrow-unexpected-error"
import fundingSubmissionLineJsonsApi, {
  type FundingLineValue,
} from "@/api/funding-submission-line-jsons-api"
import useFundingSubmissionLineJson from "@/use/use-funding-submission-line-json"
import useSnack from "@/use/use-snack"

import KeyboardShortcutsModal from "@/components/common/KeyboardShortcutsModal.vue"
import FundingSubmissionLineJsonSectionTable, {
  type ColumnNames,
} from "@/components/funding-submission-line-jsons/FundingSubmissionLineJsonSectionTable.vue"

const props = withDefaults(
  defineProps<{
    fundingSubmissionLineJsonId: number
    isWorkflowBusy?: boolean
  }>(),
  {
    isWorkflowBusy: false,
  }
)

const emit = defineEmits<{
  "update:fundingSubmissionLineJson": [fundingSubmissionLineJsonId: number]
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
const isLoading = isLoadingFundingSubmissionLineJson
const isErrored = computed(
  () => isErroredFundingSubmissionLineJson.value || isNil(fundingSubmissionLineJson.value)
)

const isSaving = ref(false)
const isWorkflowRunning = computed(() => isSaving.value || props.isWorkflowBusy)
const sections = computed<{ sectionName: string; lines: FundingLineValue[] }[]>(() => {
  const sectionGroups = groupBy(fundingSubmissionLineJson.value?.lines ?? [], "sectionName")
  return Object.entries(sectionGroups).map(([sectionName, lines]) => ({ sectionName, lines }))
})
const fundingSubmissionLineJsonSectionTables = useTemplateRef<
  InstanceType<typeof FundingSubmissionLineJsonSectionTable>[]
>("fundingSubmissionLineJsonSectionTables")
const snack = useSnack()

async function reloadWorksheet() {
  try {
    await refreshFundingSubmissionLineJson()
  } catch (error) {
    rethrowUnexpectedError(error)

    snack.error(`Failed to load worksheet: ${error}`)
  }
}

async function saveFundingSubmissionLineJson(): Promise<boolean> {
  if (isSaving.value || isLoading.value || isErrored.value) {
    return false
  }

  isSaving.value = true
  emit("saving", true)
  try {
    const jsonLines = sections.value.flatMap(({ lines }) => lines)
    await fundingSubmissionLineJsonsApi.update(fundingSubmissionLineJsonId.value, {
      lines: jsonLines,
    })
    await refreshFundingSubmissionLineJson()

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

async function replicateOwnEstimates(): Promise<void> {
  await fundingSubmissionLineJsonsApi.replicateEstimates(fundingSubmissionLineJsonId.value)
  await refreshFundingSubmissionLineJson()
  emit("update:fundingSubmissionLineJson", fundingSubmissionLineJsonId.value)
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
