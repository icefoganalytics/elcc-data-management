<template>
  <div>
    <v-alert
      v-if="hasError"
      type="error"
      density="compact"
      role="alert"
    >
      Children with Diverse Needs categories could not be loaded.
      <v-btn
        variant="text"
        @click="reload"
        >Retry</v-btn
      >
    </v-alert>
    <v-autocomplete
      v-else
      v-bind="$attrs"
      :model-value="modelValue"
      :loading="isLoading || isLoadingSelectedCategory"
      :items="allCategories"
      :disabled="disabled"
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
  </div>
</template>

<script setup lang="ts">
import { computed, onScopeDispose, ref, watch } from "vue"
import { debounce, isEmpty, isNil, uniqBy } from "lodash"

import type {
  ChildrenWithDiverseNeedsFundingCategoryAsShow,
  ChildrenWithDiverseNeedsFundingCategoryFiltersOptions,
  ChildrenWithDiverseNeedsFundingCategoryQueryOptions,
} from "@/api/children-with-diverse-needs-funding-categories-api"
import rethrowUnexpectedError from "@/api/errors/rethrow-unexpected-error"

import useChildrenWithDiverseNeedsFundingCategory from "@/use/use-children-with-diverse-needs-funding-category"
import useChildrenWithDiverseNeedsFundingCategories from "@/use/use-children-with-diverse-needs-funding-categories"

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    modelValue: number | null | undefined
    fundingPeriodId: number
    excludingCategoryIds?: number[]
    disabled?: boolean
  }>(),
  {
    excludingCategoryIds: () => [],
    disabled: false,
  }
)

const emit = defineEmits<{
  "update:modelValue": [categoryId: number | null]
}>()

const selectedCategoryId = computed(() => (props.disabled ? undefined : props.modelValue))
const {
  childrenWithDiverseNeedsFundingCategory: selectedCategory,
  isLoading: isLoadingSelectedCategory,
  isErrored: isSelectedCategoryErrored,
  fetch: reloadSelectedCategory,
} = useChildrenWithDiverseNeedsFundingCategory(selectedCategoryId)

const searchToken = ref("")
const page = ref(1)
const perPage = computed(() => (isEmpty(searchToken.value) ? 100 : 20))
const searchFilters = computed<ChildrenWithDiverseNeedsFundingCategoryFiltersOptions>(() => {
  if (isEmpty(searchToken.value)) return {}

  return {
    search: searchToken.value.trim().split(" "),
  }
})

const query = computed<ChildrenWithDiverseNeedsFundingCategoryQueryOptions>(() => ({
  where: {
    fundingPeriodId: props.fundingPeriodId,
  },
  filters: searchFilters.value,
  order: [["categoryName", "ASC"]],
  perPage: perPage.value,
  page: page.value,
}))

const {
  childrenWithDiverseNeedsFundingCategories,
  totalCount,
  isLoading,
  isErrored,
  fetch: reloadCategories,
} = useChildrenWithDiverseNeedsFundingCategories(query, {
  skipWatchIf: () => props.disabled,
})

const allCategories = computed<ChildrenWithDiverseNeedsFundingCategoryAsShow[]>(() => {
  if (props.disabled) return []

  const availableCategories = childrenWithDiverseNeedsFundingCategories.value.filter(
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
  if (!props.disabled) {
    try {
      await reloadCategories()
    } catch (error) {
      rethrowUnexpectedError(error)
    }
  }
}

async function reload() {
  const requests: Promise<unknown>[] = [reloadCategories()]
  if (!isNil(props.modelValue)) requests.push(reloadSelectedCategory())
  const results = await Promise.allSettled(requests)
  const failures = results
    .filter((result) => result.status === "rejected")
    .map((result) => result.reason)
  if (failures.length) {
    rethrowUnexpectedError(
      new AggregateError(failures, "Failed to reload Children with Diverse Needs categories")
    )
  }
}

watch(
  () => [props.fundingPeriodId, props.excludingCategoryIds],
  () => {
    debouncedUpdateSearchToken.cancel()
    updateSearchToken("")
  },
  {
    deep: true,
  }
)

watch(
  () => props.modelValue,
  async (modelValue) => {
    if (isNil(modelValue)) await reset()
  }
)

onScopeDispose(() => {
  debouncedUpdateSearchToken.cancel()
})

defineExpose({
  reset,
})
</script>
