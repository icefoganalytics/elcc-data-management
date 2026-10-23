<template>
  <v-select
    v-model="categoryId"
    :items="childCareSpaceCategories"
    item-title="categoryName"
    item-value="id"
    label="Linked Child Care Space Category"
    hint="Optional. Copies occupancy from this category within the selected funding period."
    persistent-hint
    :loading="isLoading"
    :disabled="isNil(fundingPeriodId)"
    :error="isErrored"
    :error-messages="isErrored ? 'Unable to load Child Care Space categories.' : undefined"
    clearable
  />
</template>

<script setup lang="ts">
import { computed, watch } from "vue"
import { isNil } from "lodash"

import useChildCareSpaceCategories from "@/use/use-child-care-space-categories"

const categoryId = defineModel<number | null>({ required: true })
const props = defineProps<{
  fundingPeriodId: number | null | undefined
}>()

const categoryQuery = computed(() => ({
  where: { fundingPeriodId: props.fundingPeriodId ?? undefined },
  perPage: -1,
}))
const { childCareSpaceCategories, isLoading, isErrored } = useChildCareSpaceCategories(
  categoryQuery,
  { skipWatchIf: () => isNil(props.fundingPeriodId) }
)

watch(
  () => props.fundingPeriodId,
  (_fundingPeriodId, previousFundingPeriodId) => {
    if (!isNil(previousFundingPeriodId)) {
      categoryId.value = null
    }
  }
)
</script>
