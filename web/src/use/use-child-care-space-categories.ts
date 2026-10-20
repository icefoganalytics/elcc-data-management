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
  let latestRequest = {}

  async function fetch(): Promise<ChildCareSpaceCategoryAsIndex[]> {
    const request = {}
    latestRequest = request
    const query = unref(queryOptions)
    state.isLoading = true
    try {
      const { childCareSpaceCategories, totalCount } = await childCareSpaceCategoriesApi.list(query)
      if (latestRequest === request) {
        state.isErrored = false
        state.childCareSpaceCategories = childCareSpaceCategories
        state.totalCount = totalCount
      }
      return childCareSpaceCategories
    } catch (error) {
      console.error(`Failed to fetch Child Care Space categories: ${error}`, { error })
      if (latestRequest === request) {
        state.isErrored = true
      }
      throw error
    } finally {
      if (latestRequest === request) {
        state.isLoading = false
      }
    }
  }

  watch(
    () => [skipWatchIf(), unref(queryOptions)],
    async ([skip]) => {
      if (skip) {
        return
      }

      try {
        await fetch()
      } catch {
        // fetch() preserves rejection for explicit callers; watcher requests are expected to fail.
      }
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
