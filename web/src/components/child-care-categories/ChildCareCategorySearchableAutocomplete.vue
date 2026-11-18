<template>
  <v-autocomplete
    :model-value="modelValue"
    :loading="isLoading || isLoadingChildCareCategory"
    :items="allChildCareCategories"
    :disabled="disabled"
    :error-messages="errorMessages"
    label="Child Care Category"
    hint="Search for a Child Care category."
    no-data-text="No Child Care categories available"
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
    <template #chip="{ props: chipProps, item: { raw: result } }">
      <ChildCareCategoryChip
        v-if="!isNil(result.id)"
        v-bind="chipProps"
        :child-care-category-id="result.id"
      />
      <v-chip
        v-else
        v-bind="chipProps"
        :text="'Unknown#' + JSON.stringify(result)"
      />
    </template>
    <template #item="{ props: itemProps, item: { raw: result } }">
      <ChildCareCategoryAttributesListItem
        v-if="!isNil(result.id)"
        v-bind="safeItemProps(itemProps)"
        :child-care-category="result"
      />
      <v-list-item
        v-else
        v-bind="safeItemProps(itemProps)"
        :title="'Unknown#' + (result.id || JSON.stringify(result))"
      />
    </template>
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

<!-- Special module scope (non-setup) required for exports -->
<script lang="ts">
export {
  type ChildCareCategoryAsIndex,
  type ChildCareCategoryWhereOptions,
  type ChildCareCategoryFiltersOptions,
  type ChildCareCategoryQueryOptions,
} from "@/use/use-child-care-categories"
</script>

<script lang="ts" setup>
import { computed, onScopeDispose, ref, watch } from "vue"
import { castArray, debounce, isEmpty, isNil, omit, uniqBy } from "lodash"

import useChildCareCategory from "@/use/use-child-care-category"
import useChildCareCategories, {
  type ChildCareCategoryAsIndex,
  type ChildCareCategoryWhereOptions,
  type ChildCareCategoryFiltersOptions,
  type ChildCareCategoryQueryOptions,
} from "@/use/use-child-care-categories"

import ChildCareCategoryChip from "@/components/child-care-categories/ChildCareCategoryChip.vue"
import ChildCareCategoryAttributesListItem from "@/components/child-care-categories/ChildCareCategoryAttributesListItem.vue"

const props = defineProps<{
  modelValue: number | null | undefined
  where?: ChildCareCategoryWhereOptions
  filters?: Omit<ChildCareCategoryFiltersOptions, "search">
  disabled?: boolean
}>()

const emit = defineEmits<{
  "update:modelValue": [childCareCategoryId: number | null]
}>()

const childCareCategoryId = computed(() => (props.disabled ? undefined : props.modelValue))
const {
  childCareCategory,
  isLoading: isLoadingChildCareCategory,
  isErrored: isChildCareCategoryErrored,
} = useChildCareCategory(childCareCategoryId)

const searchToken = ref("")

function updateSearchToken(value: string) {
  searchToken.value = value
  page.value = 1
}

const debouncedUpdateSearchToken = debounce(updateSearchToken, 500)

const searchFilter = computed(() => {
  if (isNil(searchToken.value) || isEmpty(searchToken.value)) return {}

  return {
    search: searchToken.value.trim().split(" "),
  }
})

const perPage = computed(() => {
  if (isNil(searchToken.value) || isEmpty(searchToken.value)) return 100

  return 20
})

const page = ref(1)

const childCareCategoriesQuery = computed<ChildCareCategoryQueryOptions>(() => {
  return {
    where: props.where,
    filters: {
      ...props.filters,
      ...searchFilter.value,
    },
    order: [["categoryName", "ASC"]],
    perPage: perPage.value,
    page: page.value,
  }
})
const { childCareCategories, totalCount, isLoading, isErrored, refresh } = useChildCareCategories(
  childCareCategoriesQuery,
  {
    skipWatchIf: () => props.disabled === true,
  }
)

const allChildCareCategories = computed<ChildCareCategoryAsIndex[]>(() => {
  if (props.disabled) return []

  const fundingPeriodFilter = props.where?.fundingPeriodId
  const fundingPeriodIds = isNil(fundingPeriodFilter) ? null : castArray(fundingPeriodFilter)
  const availableChildCareCategories = childCareCategories.value.filter(
    (childCareCategory) =>
      isNil(fundingPeriodIds) || fundingPeriodIds.includes(childCareCategory.fundingPeriodId)
  )
  if (
    isNil(childCareCategory.value) ||
    (!isNil(fundingPeriodIds) &&
      !fundingPeriodIds.includes(childCareCategory.value.fundingPeriodId))
  ) {
    return availableChildCareCategories
  }

  return uniqBy([...availableChildCareCategories, childCareCategory.value], "id")
})

const errorMessages = computed(() => {
  if (props.disabled) return []
  if (isErrored.value || (!isNil(props.modelValue) && isChildCareCategoryErrored.value)) {
    return ["Failed to load Child Care categories."]
  }

  return []
})

/**
 * Title is an attribute of the item object, which overrides the title in the list item, so title must be removed.
 */
function safeItemProps(itemProps: Record<string, unknown>) {
  return omit(itemProps, ["title"])
}

async function reset() {
  debouncedUpdateSearchToken.cancel()
  searchToken.value = ""
  page.value = 1
  childCareCategory.value = null
  if (!props.disabled) {
    await refresh()
  }
}

watch(
  () => props.modelValue,
  async (newModelValue) => {
    if (isNil(newModelValue)) {
      await reset()
    }
  }
)

watch(
  () => [props.where, props.filters],
  () => {
    debouncedUpdateSearchToken.cancel()
    updateSearchToken("")
  },
  {
    deep: true,
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

defineExpose({
  reset,
})
</script>
