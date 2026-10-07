import { type Ref, reactive, ref, toRefs, unref, watch } from "vue"

import childCareSpacesApi, {
  type ChildCareSpaceAsIndex,
  type ChildCareSpaceFiltersOptions,
  type ChildCareSpaceQueryOptions,
  type ChildCareSpaceWhereOptions,
} from "@/api/child-care-spaces-api"

export {
  type ChildCareSpaceAsIndex,
  type ChildCareSpaceFiltersOptions,
  type ChildCareSpaceQueryOptions,
  type ChildCareSpaceWhereOptions,
}

export function useChildCareSpaces(
  queryOptions: Ref<ChildCareSpaceQueryOptions> = ref({}),
  { skipWatchIf = () => false }: { skipWatchIf?: () => boolean } = {}
) {
  const state = reactive<{
    childCareSpaces: ChildCareSpaceAsIndex[]
    totalCount: number
    isLoading: boolean
    isErrored: boolean
  }>({
    childCareSpaces: [],
    totalCount: 0,
    isLoading: false,
    isErrored: false,
  })

  async function fetch(): Promise<ChildCareSpaceAsIndex[]> {
    state.isLoading = true
    try {
      const { childCareSpaces, totalCount } = await childCareSpacesApi.list(unref(queryOptions))
      state.isErrored = false
      state.childCareSpaces = childCareSpaces
      state.totalCount = totalCount
      return childCareSpaces
    } catch (error) {
      console.error(`Failed to fetch Child Care Spaces: ${error}`, { error })
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

export default useChildCareSpaces
