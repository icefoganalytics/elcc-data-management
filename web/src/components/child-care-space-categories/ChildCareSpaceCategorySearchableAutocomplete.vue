<template>
  <v-autocomplete
    :model-value="modelValue"
    :items="allChildCareSpaceCategories"
    :loading="isLoading || isLoadingSelectedCategory"
    :disabled="disabled"
    :error-messages="errorMessages"
    label="Child Care Space Category"
    hint="Search for a Child Care Space category."
    item-title="categoryName"
    item-value="id"
    auto-select-first
    chips
    hide-selected
    no-filter
    @update:model-value="emit('update:modelValue', $event)"
    @update:search="debouncedUpdateSearchToken"
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
</template>

<script lang="ts">
export {
  type ChildCareSpaceCategoryAsIndex,
  type ChildCareSpaceCategoryFiltersOptions,
  type ChildCareSpaceCategoryQueryOptions,
  type ChildCareSpaceCategoryWhereOptions,
} from "@/use/use-child-care-space-categories"
</script>

<script setup lang="ts">
import { computed, onScopeDispose, ref, watch } from "vue"
import { castArray, debounce, isEmpty, isNil, uniqBy } from "lodash"

import useChildCareSpaceCategories, {
  type ChildCareSpaceCategoryAsIndex,
  type ChildCareSpaceCategoryFiltersOptions,
  type ChildCareSpaceCategoryQueryOptions,
  type ChildCareSpaceCategoryWhereOptions,
} from "@/use/use-child-care-space-categories"

const props = defineProps<{
  modelValue: number | null | undefined
  where?: ChildCareSpaceCategoryWhereOptions
  filters?: Omit<ChildCareSpaceCategoryFiltersOptions, "search">
  disabled?: boolean
}>()

const emit = defineEmits<{
  "update:modelValue": [childCareSpaceCategoryId: number | null]
}>()

const searchToken = ref("")
const page = ref(1)

function updateSearchToken(value: string) {
  searchToken.value = value
  page.value = 1
}

const debouncedUpdateSearchToken = debounce(updateSearchToken, 500)

const searchFilter = computed(() => {
  if (isEmpty(searchToken.value)) return {}

  return { search: searchToken.value.trim().split(" ") }
})

const perPage = computed(() => {
  if (isEmpty(searchToken.value)) return 100

  return 20
})

const childCareSpaceCategoriesQuery = computed<ChildCareSpaceCategoryQueryOptions>(() => ({
  where: props.where,
  filters: { ...props.filters, ...searchFilter.value },
  order: [["categoryName", "ASC"]],
  perPage: perPage.value,
  page: page.value,
}))
const { childCareSpaceCategories, totalCount, isLoading, isErrored } = useChildCareSpaceCategories(
  childCareSpaceCategoriesQuery,
  { skipWatchIf: () => props.disabled === true }
)

const selectedCategoryQuery = computed<ChildCareSpaceCategoryQueryOptions>(() => ({
  where: { ...props.where, id: props.modelValue ?? undefined },
  perPage: 1,
}))
const {
  childCareSpaceCategories: selectedCategories,
  isLoading: isLoadingSelectedCategory,
  isErrored: isSelectedCategoryErrored,
} = useChildCareSpaceCategories(selectedCategoryQuery, {
  skipWatchIf: () => props.disabled === true || isNil(props.modelValue),
})

const allChildCareSpaceCategories = computed<ChildCareSpaceCategoryAsIndex[]>(() => {
  if (props.disabled) return []

  const fundingPeriodFilter = props.where?.fundingPeriodId
  const fundingPeriodIds = isNil(fundingPeriodFilter) ? null : castArray(fundingPeriodFilter)
  const availableCategories = childCareSpaceCategories.value.filter(
    (category) => isNil(fundingPeriodIds) || fundingPeriodIds.includes(category.fundingPeriodId)
  )
  const selectedCategory = selectedCategories.value.find(
    (category) =>
      category.id === props.modelValue &&
      (isNil(fundingPeriodIds) || fundingPeriodIds.includes(category.fundingPeriodId))
  )
  if (isNil(selectedCategory)) return availableCategories

  return uniqBy([...availableCategories, selectedCategory], "id")
})

const errorMessages = computed(() => {
  if (props.disabled) return []
  if (isErrored.value || (!isNil(props.modelValue) && isSelectedCategoryErrored.value)) {
    return ["Failed to load Child Care Space categories."]
  }

  return []
})

function resetSearch() {
  debouncedUpdateSearchToken.cancel()
  searchToken.value = ""
  page.value = 1
}

watch(() => [props.where, props.filters], resetSearch, { deep: true })

watch(
  () => props.modelValue,
  (value) => {
    if (isNil(value)) resetSearch()
  }
)

onScopeDispose(() => {
  debouncedUpdateSearchToken.cancel()
})

const hasMore = computed(() => !props.disabled && page.value * perPage.value < totalCount.value)

function nextPage() {
  page.value += 1
}

function previousPage() {
  page.value -= 1
}
</script>
