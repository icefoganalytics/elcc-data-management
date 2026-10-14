<template>
  <v-skeleton-loader
    v-if="isNil(fundingSubmissionLine)"
    type="card"
  />
  <v-form
    v-if="!isNil(fundingSubmissionLine)"
    @submit.prevent="saveAndNotify"
  >
    <v-row>
      <v-col
        cols="12"
        md="6"
      >
        <DescriptionElement
          label="Fiscal Year"
          :model-value="fundingSubmissionLine.fiscalYear"
          vertical
        />
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <DescriptionElement
          label="Age Range"
          vertical
        >
          {{ fundingSubmissionLine.fromAge }} - {{ fundingSubmissionLine.toAge }}
        </DescriptionElement>
      </v-col>
    </v-row>

    <v-divider class="my-4" />

    <v-row>
      <v-col
        cols="12"
        md="6"
      >
        <v-text-field
          v-if="isImmutableSectionName"
          v-model="fundingSubmissionLine.sectionName"
          label="Section"
          variant="outlined"
          density="comfortable"
        >
          <template #append-inner>
            <v-icon
              icon="mdi-lock-outline"
              end
            />
          </template>
          <v-tooltip
            activator="parent"
            text="This section name is immutable and cannot be changed."
          />
        </v-text-field>
        <v-text-field
          v-else
          v-model="fundingSubmissionLine.sectionName"
          label="Section"
          variant="outlined"
          density="comfortable"
        />
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <v-text-field
          v-model="fundingSubmissionLine.lineName"
          label="Line"
          variant="outlined"
          density="comfortable"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col
        cols="12"
        md="6"
      >
        <v-text-field
          v-model="fundingSubmissionLine.fromAge"
          label="From age"
          variant="outlined"
          density="comfortable"
        />
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <v-text-field
          v-model="fundingSubmissionLine.toAge"
          label="To age"
          variant="outlined"
          density="comfortable"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-text-field
          v-model="fundingSubmissionLine.monthlyAmount"
          label="Monthly amount"
          variant="outlined"
          density="comfortable"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col class="d-flex justify-end">
        <v-btn
          color="primary"
          :loading="isSaving"
          type="submit"
        >
          Save Changes
        </v-btn>
        <v-spacer />
        <v-btn
          color="warning"
          variant="outlined"
          :to="{
            name: 'administration/submission-lines/SubmissionLinePage',
            params: {
              fundingSubmissionLineId,
            },
          }"
        >
          Cancel
        </v-btn>
      </v-col>
    </v-row>
  </v-form>
</template>

<script setup lang="ts">
import { computed, ref, toRefs } from "vue"
import { isNil } from "lodash"

import useFundingSubmissionLine, {
  FundingSubmissionLineImmutableSectionNames,
} from "@/use/use-funding-submission-line"
import useSnack from "@/use/use-snack"

import DescriptionElement from "@/components/common/DescriptionElement.vue"

const props = defineProps<{
  fundingSubmissionLineId: number
}>()

const emit = defineEmits<{
  updated: [fundingSubmissionLineId: number]
}>()

const isSaving = ref(false)
const snack = useSnack()

const { fundingSubmissionLineId } = toRefs(props)
const { fundingSubmissionLine, save } = useFundingSubmissionLine(fundingSubmissionLineId)

const isImmutableSectionName = computed(() => {
  if (isNil(fundingSubmissionLine.value)) return false

  const { sectionName } = fundingSubmissionLine.value
  return Object.values<string>(FundingSubmissionLineImmutableSectionNames).includes(sectionName)
})

async function saveAndNotify() {
  if (isNil(fundingSubmissionLine.value)) return

  isSaving.value = true
  try {
    const updatedFundingSubmissionLine = await save()
    emit("updated", updatedFundingSubmissionLine.id)
    snack.success("Submission line updated successfully!")
  } catch (error) {
    console.error(`Failed to update submission line: ${error}`, { error })
    snack.error(`Failed to update submission line: ${error}`)
  } finally {
    isSaving.value = false
  }
}
</script>
