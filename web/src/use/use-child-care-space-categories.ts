import { type Ref, reactive, ref, toRefs, unref, watch } from "vue"

import childCareSpaceCategoriesApi, {
  type ChildCareSpaceCategoryAsIndex,
  type ChildCareSpaceCategoryFiltersOptions,
  type ChildCareSpaceCategoryQueryOptions,
  type ChildCareSpaceCategoryWhereOptions,
} from "@/api/child-care-space-categories-api"

export {
  type ChildCareSpaceCategoryAsIndex,
  type ChildCareSpaceCategoryFiltersOptions,
  type ChildCareSpaceCategoryQueryOptions,
  type ChildCareSpaceCategoryWhereOptions,
}

export function useChildCareSpaceCategories(
  queryOptions: Ref<ChildCareSpaceCategoryQueryOptions> = ref({}),
  { skipWatchIf = () => false }: { skipWatchIf?: () => boolean } = {}
) {
  const state = reactive<{
    childCareSpaceCategories: ChildCareSpaceCategoryAsIndex[]
    totalCount: number
    isLoading: boolean
    isErrored: boolean
  }>({
    childCareSpaceCategories: [],
    totalCount: 0,
    isLoading: false,
    isErrored: false,
  })

  async function fetch(): Promise<ChildCareSpaceCategoryAsIndex[]> {
    state.isLoading = true
    try {
      const { childCareSpaceCategories, totalCount } = await childCareSpaceCategoriesApi.list(
        unref(queryOptions)
      )
      state.isErrored = false
      state.childCareSpaceCategories = childCareSpaceCategories
      state.totalCount = totalCount
      return childCareSpaceCategories
    } catch (error) {
      console.error(`Failed to fetch Child Care Space categories: ${error}`, { error })
      state.isErrored = true
      throw error
    } finally {
      state.isLoading = false
    }
  }

  watch(
    () => [skipWatchIf(), unref(queryOptions)],
    async ([skip]) => {
      if (skip) return

      await fetch()
    },
    { deep: true, immediate: true }
  )

  return {
    ...toRefs(state),
    fetch,
    refresh: fetch,
  }
}

export default useChildCareSpaceCategories
