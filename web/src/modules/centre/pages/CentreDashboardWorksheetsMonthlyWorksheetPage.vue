<template>
  <div class="ma-4">
    <v-btn
      color="primary"
      class="float-right"
      @click="save"
      :loading="isLoading"
      >Save</v-btn
    >

    <v-progress-circular
      v-if="isLoading"
      indeterminate
    />
    <template v-else>
      <h2 class="mb-3">{{ dateName }} {{ calendarYear }}</h2>
      <v-btn
        v-if="dateName == FIRST_FISCAL_MONTH_NAME"
        :loading="isReplicatingEstimates"
        color="yg_sun"
        class="float-right mb-3"
        size="small"
        @click="replicateFirstEstimateToAllOthers"
      >
        <v-icon>mdi-content-copy</v-icon> Replicate Estimates
      </v-btn>
    </template>

    <v-skeleton-loader
      style="clear: both"
      type="table"
      v-if="isLoading"
    ></v-skeleton-loader>

    <div
      v-for="({ sectionName, lines }, sectionIndex) in sections"
      style="clear: both"
    >
      <h4>{{ sectionName }}</h4>

      <SectionTable
        ref="sectionTables"
        :lines="lines"
        @line-changed="propagateUpdatesAsNeeded(sectionIndex, $event)"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { watch, computed, ref } from "vue"
import { groupBy, isEmpty, isEqual, isNil } from "lodash"
import moment from "moment"

import fundingSubmissionLineJsonsApi, {
  FundingSubmissionLineJson,
} from "@/api/funding-submission-line-jsons-api"
import useFundingSubmissionLineJsonsStore, {
  FundingLineValue,
} from "@/store/funding-submission-line-jsons"
import { useNotificationStore } from "@/store/NotificationStore"

import SectionTable from "@/modules/centre/components/centre-dashboard-worksheets-tab-monthly-worksheet-tab/SectionTable.vue"

const FIRST_FISCAL_MONTH_NAME = "April"

const notificationStore = useNotificationStore()
const fundingSubmissionLineJsonsStore = useFundingSubmissionLineJsonsStore()

const props = defineProps({
  centreId: {
    type: Number,
    required: true,
  },
  fiscalYearSlug: {
    type: String,
    required: true,
  },
  fundingSubmissionLineJsonId: {
    type: Number,
    required: true,
  },
  month: {
    type: String,
    required: true,
  },
})

const fundingSubmissionLineJson = ref<FundingSubmissionLineJson>()
const dateName = computed(() => fundingSubmissionLineJson.value?.dateName)

const isLoading = ref(true)
const isReplicatingEstimates = ref(false)
const fiscalYear = computed(() => fundingSubmissionLineJson.value?.fiscalYear)
const calendarYear = computed(() =>
  moment.utc(fundingSubmissionLineJson.value?.dateStart).format("YYYY")
)
const sections = computed<{ sectionName: string; lines: FundingLineValue[] }[]>(() => {
  if (isEmpty(fundingSubmissionLineJson.value)) {
    return []
  }

  const lines = fundingSubmissionLineJson.value.lines
  const sectionGroups = groupBy(lines, "sectionName")
  return Object.entries(sectionGroups).map(([sectionName, lines]) => {
    return { sectionName, lines }
  })
})
const sectionTables = ref<InstanceType<typeof SectionTable>[]>([])

async function fetchFundingSubmissionLineJson(fundingSubmissionLineJsonId: number) {
  isLoading.value = true
  try {
    fundingSubmissionLineJson.value = await fundingSubmissionLineJsonsApi
      .get(fundingSubmissionLineJsonId)
      .then(({ fundingSubmissionLineJson }) => fundingSubmissionLineJson)
  } catch (error) {
    console.error(error)
    notificationStore.notify({
      text: `Failed to fetch worksheet: ${error}`,
      variant: "error",
    })
  } finally {
    isLoading.value = false
  }
}

watch<[number, number], true>(
  () => [props.centreId, props.fundingSubmissionLineJsonId],
  async (newValues, oldValues) => {
    if (isEqual(newValues, oldValues)) {
      return
    }

    await fetchFundingSubmissionLineJson(props.fundingSubmissionLineJsonId)
  },
  {
    immediate: true,
  }
)

async function save() {
  isLoading.value = true
  try {
    const lines = sections.value.flatMap((section) => section.lines)
    await fundingSubmissionLineJsonsApi.update(props.fundingSubmissionLineJsonId, { lines })
  } catch (error) {
    console.error(error)
    notificationStore.notify({
      text: `Failed to save worksheet: ${error}`,
      variant: "error",
    })
  } finally {
    isLoading.value = false
  }
}

async function replicateFirstEstimateToAllOthers() {
  isReplicatingEstimates.value = true
  try {
    await save()

    const fundingSubmissionLineJsons = await fundingSubmissionLineJsonsStore.fetch({
      where: {
        centreId: props.centreId,
        fiscalYear: fiscalYear.value,
      },
    })
    const firstSubmission = fundingSubmissionLineJsons.find(
      (submission) => submission.dateName === FIRST_FISCAL_MONTH_NAME
    )
    if (isNil(firstSubmission)) {
      throw new Error(`Could not find submission for ${FIRST_FISCAL_MONTH_NAME}`)
    }

    const nonFirstSubmissions = fundingSubmissionLineJsons.filter(
      (submission) => submission.dateName !== FIRST_FISCAL_MONTH_NAME
    )

    for (const submission of nonFirstSubmissions) {
      await fundingSubmissionLineJsonsApi.update(submission.id, { lines: firstSubmission.lines })
    }
  } catch (error) {
    notificationStore.notify({
      text: `Failed to load worksheets: ${error}`,
      variant: "error",
    })
  } finally {
    isReplicatingEstimates.value = false
  }
}

function propagateUpdatesAsNeeded(
  sectionIndex: number,
  { line, lineIndex }: { line: FundingLineValue; lineIndex: number }
) {
  // Bind section 1 to sections 2 and 3
  // When you update the values in section 1, it will propagated the values to section 2 and 3
  if (sectionIndex === 0) {
    const section1Line = sections.value[1].lines[lineIndex]
    section1Line.estimatedChildOccupancyRate = line.estimatedChildOccupancyRate
    section1Line.actualChildOccupancyRate = line.actualChildOccupancyRate

    sectionTables.value[1].refreshLineTotals(section1Line)

    const section2Line = sections.value[2].lines[lineIndex]
    section2Line.estimatedChildOccupancyRate = line.estimatedChildOccupancyRate
    section2Line.actualChildOccupancyRate = line.actualChildOccupancyRate
    sectionTables.value[2].refreshLineTotals(section2Line)
  }
}
</script>

<style scoped>
h4 {
  margin-bottom: 10px;
  font-weight: 400;
  background-color: #55b6c2;
  margin-left: -8px;
  padding: 8px;
  border-radius: 4px;
  margin-top: 13px;
}
</style>