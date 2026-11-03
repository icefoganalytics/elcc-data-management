<template>
  <v-autocomplete
    :model-value="modelValue"
    :items="availableCategories"
    :loading="isLoading"
    :disabled="disabled || isLoading"
    :error-messages="
      isErrored ? 'Categories could not be loaded. Open the list to retry.' : undefined
    "
    label="Administration Cost Category"
    hint="Select an annual category in the current funding period."
    no-data-text="No available categories"
    item-title="categoryName"
    item-value="id"
    auto-select-first
    chips
    hide-selected
    no-filter
    @update:model-value="emit('update:modelValue', $event)"
    @update:search="updateSearch"
  >
    <template #item="{ props: itemProps, item: { raw: category } }">
      <v-list-item
        v-bind="itemProps"
        :title="category.categoryName"
        :subtitle="category.monthlyAmount"
      />
    </template>
    <template #append-item>
      <v-btn
        v-if="isErrored"
        variant="text"
        @click.stop="reload"
        >Retry</v-btn
      >
    </template>
  </v-autocomplete>
</template>

<script setup lang="ts">
import { computed, onScopeDispose, ref } from "vue"
import { debounce } from "lodash"

import { MAX_PER_PAGE } from "@/api/base-api"
import useAdministrationCostCategories from "@/use/use-administration-cost-categories"

const props = withDefaults(
  defineProps<{
    modelValue: number | null | undefined
    fundingPeriodId: number
    disabled?: boolean
    excludingCategoryIds?: number[]
  }>(),
  { disabled: false, excludingCategoryIds: () => [] }
)
const emit = defineEmits<{ "update:modelValue": [value: number | null] }>()
const search = ref("")
const query = computed(() => ({
  where: { fundingPeriodId: props.fundingPeriodId },
  filters: { search: search.value },
  perPage: MAX_PER_PAGE,
}))
const { administrationCostCategories, isLoading, isErrored, fetch } =
  useAdministrationCostCategories(query)
const availableCategories = computed(() =>
  administrationCostCategories.value.filter(({ id }) => !props.excludingCategoryIds.includes(id))
)
const updateSearch = debounce((value: string | null) => {
  search.value = value ?? ""
}, 350)
onScopeDispose(() => updateSearch.cancel())

async function reload() {
  try {
    await fetch()
  } catch {
    // The collection exposes the active load error and keeps Retry available.
  }
}
</script>
