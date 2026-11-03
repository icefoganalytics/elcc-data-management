<template>
  <div>
    <v-autocomplete
      v-bind="$attrs"
      :model-value="modelValue"
      :loading="isLoading || isLoadingSelectedCategory"
      :items="allCategories"
      :disabled="disabled"
      :error-messages="errorMessages"
      label="Children with Diverse Needs Category"
      hint="Search for a Children with Diverse Needs category."
      no-data-text="No Children with Diverse Needs categories available"
      item-title="categoryName"
      item-value="id"
      auto-select-first
      chips
      hide-selected
      no-filter
      @update:model-value="emit('update:modelValue', $event)"
      @update:search="debouncedUpdateSearchToken"
      @click:clear="reset"
    >
      <template
        v-if="hasMore"
        #append-item
      >
        <v-divider />
        <v-list-item
          class="text-primary text-center"
          title="Show More"
          @click="nextPage"
        />
      </template>
      <template
        v-if="page > 1"
        #prepend-item
      >
        <v-list-item
          class="text-primary text-center"
          title="Show Less"
          @click="previousPage"
        />
        <v-divider />
      </template>
    </v-autocomplete>
    <v-alert
      v-if="hasError"
      type="error"
      density="compact"
      role="alert"
    >
      Diverse need categories could not be loaded.
      <v-btn
        variant="text"
        @click="reload"
        >Retry</v-btn
      >
    </v-alert>
  </div>
</template>

<script setup lang="ts">
import { computed, onScopeDispose, ref, watch } from "vue"
import { debounce, isEmpty, isNil, uniqBy } from "lodash"

import useChildrenWithDiverseNeedsFundingCategory from "@/use/use-children-with-diverse-needs-funding-category"
import useChildrenWithDiverseNeedsFundingCategories from "@/use/use-children-with-diverse-needs-funding-categories"
import type {
  ChildrenWithDiverseNeedsFundingCategoryAsIndex,
  ChildrenWithDiverseNeedsFundingCategoryFiltersOptions,
  ChildrenWithDiverseNeedsFundingCategoryQueryOptions,
} from "@/api/children-with-diverse-needs-funding-categories-api"

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    modelValue: number | null | undefined
    fundingPeriodId: number
    excludingCategoryIds?: number[]
    disabled?: boolean
  }>(),
  { excludingCategoryIds: () => [], disabled: false }
)
const emit = defineEmits<{
  "update:modelValue": [categoryId: number | null]
}>()

const selectedCategoryId = computed(() => (props.disabled ? undefined : props.modelValue))
const {
  childrenWithChildrenWithDiverseNeedsFundingRecordsCategory: selectedCategory,
  isLoading: isLoadingSelectedCategory,
  isErrored: isSelectedCategoryErrored,
  fetch: reloadSelectedCategory,
} = useChildrenWithDiverseNeedsFundingCategory(selectedCategoryId)
const searchToken = ref("")
const page = ref(1)
const perPage = computed(() => (isEmpty(searchToken.value) ? 100 : 20))
const searchFilters = computed<ChildrenWithDiverseNeedsFundingCategoryFiltersOptions>(() => {
  if (isEmpty(searchToken.value)) return {}

  return { search: searchToken.value.trim().split(" ") }
})
const query = computed<ChildrenWithDiverseNeedsFundingCategoryQueryOptions>(() => ({
  where: { fundingPeriodId: props.fundingPeriodId },
  filters: searchFilters.value,
  order: [["categoryName", "ASC"]],
  perPage: perPage.value,
  page: page.value,
}))
const {
  childrenWithChildrenWithDiverseNeedsFundingRecordsCategories,
  totalCount,
  isLoading,
  isErrored,
  fetch: reloadCategories,
} = useChildrenWithDiverseNeedsFundingCategories(query)
const allCategories = computed<ChildrenWithDiverseNeedsFundingCategoryAsIndex[]>(() => {
  if (props.disabled) return []

  const availableCategories = childrenWithChildrenWithDiverseNeedsFundingRecordsCategories.value.filter(
    ({ id }) => !props.excludingCategoryIds.includes(id)
  )
  if (
    isNil(selectedCategory.value) ||
    selectedCategory.value.fundingPeriodId !== props.fundingPeriodId ||
    props.excludingCategoryIds.includes(selectedCategory.value.id)
  ) {
    return availableCategories
  }

  return uniqBy([...availableCategories, selectedCategory.value], "id")
})
const errorMessages = computed(() => {
  if (props.disabled) return []
  if (isErrored.value || (!isNil(props.modelValue) && isSelectedCategoryErrored.value)) {
    return ["Failed to load Children with Diverse Needs categories."]
  }

  return []
})
const hasError = computed(
  () =>
    !props.disabled &&
    (isErrored.value || (!isNil(props.modelValue) && isSelectedCategoryErrored.value))
)
const hasMore = computed(() => !props.disabled && page.value * perPage.value < totalCount.value)

function updateSearchToken(value: string) {
  searchToken.value = value
  page.value = 1
}

const debouncedUpdateSearchToken = debounce(updateSearchToken, 500)

function nextPage() {
  page.value += 1
}

function previousPage() {
  page.value -= 1
}

async function reset() {
  debouncedUpdateSearchToken.cancel()
  searchToken.value = ""
  page.value = 1
  if (!props.disabled) await reloadCategories()
}

async function reload() {
  const requests: Promise<unknown>[] = [reloadCategories()]
  if (!isNil(props.modelValue)) requests.push(reloadSelectedCategory())
  await Promise.allSettled(requests)
}

watch(
  () => [props.fundingPeriodId, props.excludingCategoryIds],
  () => {
    debouncedUpdateSearchToken.cancel()
    updateSearchToken("")
  },
  { deep: true }
)

watch(
  () => props.modelValue,
  (modelValue) => {
    if (isNil(modelValue)) void reset()
  }
)

onScopeDispose(() => debouncedUpdateSearchToken.cancel())

defineExpose({ reset })
</script>
