<template>
  <v-autocomplete
    :model-value="modelValue"
    :loading="isLoading || isLoadingChildCareSpaceCategory"
    :items="allChildCareSpaceCategories"
    :disabled="disabled"
    :error-messages="errorMessages"
    label="Child Care Space Category"
    hint="Search for a Child Care Space category."
    no-data-text="No Child Care Space categories available"
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
      <ChildCareSpaceCategoryChip
        v-if="!isNil(result.id)"
        v-bind="chipProps"
        :child-care-space-category-id="result.id"
      />
      <v-chip
        v-else
        v-bind="chipProps"
        :text="'Unknown#' + JSON.stringify(result)"
      />
    </template>
    <template #item="{ props: itemProps, item: { raw: result } }">
      <ChildCareSpaceCategoryAttributesListItem
        v-if="!isNil(result.id)"
        v-bind="safeItemProps(itemProps)"
        :child-care-space-category="result"
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
  type ChildCareSpaceCategoryAsIndex,
  type ChildCareSpaceCategoryWhereOptions,
  type ChildCareSpaceCategoryFiltersOptions,
  type ChildCareSpaceCategoryQueryOptions,
} from "@/use/use-child-care-space-categories"
</script>

<script lang="ts" setup>
import { computed, onScopeDispose, ref, watch } from "vue"
import { castArray, debounce, isEmpty, isNil, omit, uniqBy } from "lodash"

import useChildCareSpaceCategory from "@/use/use-child-care-space-category"
import useChildCareSpaceCategories, {
  type ChildCareSpaceCategoryAsIndex,
  type ChildCareSpaceCategoryWhereOptions,
  type ChildCareSpaceCategoryFiltersOptions,
  type ChildCareSpaceCategoryQueryOptions,
} from "@/use/use-child-care-space-categories"

import ChildCareSpaceCategoryChip from "@/components/child-care-space-categories/ChildCareSpaceCategoryChip.vue"
import ChildCareSpaceCategoryAttributesListItem from "@/components/child-care-space-categories/ChildCareSpaceCategoryAttributesListItem.vue"

const props = defineProps<{
  modelValue: number | null | undefined
  where?: ChildCareSpaceCategoryWhereOptions
  filters?: Omit<ChildCareSpaceCategoryFiltersOptions, "search">
  disabled?: boolean
}>()

const emit = defineEmits<{
  "update:modelValue": [childCareSpaceCategoryId: number | null]
}>()

const childCareSpaceCategoryId = computed(() => (props.disabled ? undefined : props.modelValue))
const {
  childCareSpaceCategory,
  isLoading: isLoadingChildCareSpaceCategory,
  isErrored: isChildCareSpaceCategoryErrored,
} = useChildCareSpaceCategory(childCareSpaceCategoryId)

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

const childCareSpaceCategoriesQuery = computed<ChildCareSpaceCategoryQueryOptions>(() => {
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
const { childCareSpaceCategories, totalCount, isLoading, isErrored, refresh } =
  useChildCareSpaceCategories(childCareSpaceCategoriesQuery, {
    skipWatchIf: () => props.disabled === true,
  })

const allChildCareSpaceCategories = computed<ChildCareSpaceCategoryAsIndex[]>(() => {
  if (props.disabled) return []

  const fundingPeriodFilter = props.where?.fundingPeriodId
  const fundingPeriodIds = isNil(fundingPeriodFilter) ? null : castArray(fundingPeriodFilter)
  const availableChildCareSpaceCategories = childCareSpaceCategories.value.filter(
    (childCareSpaceCategory) =>
      isNil(fundingPeriodIds) || fundingPeriodIds.includes(childCareSpaceCategory.fundingPeriodId)
  )
  if (
    isNil(childCareSpaceCategory.value) ||
    (!isNil(fundingPeriodIds) &&
      !fundingPeriodIds.includes(childCareSpaceCategory.value.fundingPeriodId))
  ) {
    return availableChildCareSpaceCategories
  }

  return uniqBy([...availableChildCareSpaceCategories, childCareSpaceCategory.value], "id")
})

const errorMessages = computed(() => {
  if (props.disabled) return []
  if (isErrored.value || (!isNil(props.modelValue) && isChildCareSpaceCategoryErrored.value)) {
    return ["Failed to load Child Care Space categories."]
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
  childCareSpaceCategory.value = null
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
