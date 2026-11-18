import { isCancel } from "axios"
import { type Ref, onScopeDispose, reactive, ref, toRefs, unref, watch } from "vue"

import childCareSpacesApi, {
  type ChildCareSpaceAsIndex,
  type ChildCareSpaceFiltersOptions,
  type ChildCareSpaceQueryOptions,
  type ChildCareSpaceSummaries,
  type ChildCareSpaceWhereOptions,
} from "@/api/child-care-spaces-api"
import { ApiOperationError } from "@/api/errors/api-operation-error"

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
    summaries: ChildCareSpaceSummaries
    isLoading: boolean
    isErrored: boolean
  }>({
    childCareSpaces: [],
    totalCount: 0,
    summaries: {
      totalEstimated: "0.0000",
      totalActual: "0.0000",
      totalEstimatedOccupancy: "0.0000",
      totalActualOccupancy: "0.0000",
    },
    isLoading: false,
    isErrored: false,
  })
  let requestController: AbortController | undefined

  async function fetch(): Promise<ChildCareSpaceAsIndex[]> {
    requestController?.abort()
    const controller = new AbortController()
    requestController = controller
    state.isLoading = true
    try {
      const { childCareSpaces, totalCount, summaries } = await childCareSpacesApi.list(
        unref(queryOptions),
        { signal: controller.signal }
      )
      if (controller.signal.aborted) return state.childCareSpaces

      state.isErrored = false
      state.childCareSpaces = childCareSpaces
      state.totalCount = totalCount
      state.summaries = summaries
      return childCareSpaces
    } catch (error) {
      if (controller.signal.aborted || isCancel(error)) return state.childCareSpaces

      state.isErrored = true
      throw error
    } finally {
      state.isLoading = false
    }
  }

  watch(
    () => [skipWatchIf(), unref(queryOptions)],
    async ([skip]) => {
      if (skip) {
        requestController?.abort()
        state.isLoading = false
        return
      }

      await fetch().catch((error) => {
        if (error instanceof ApiOperationError) {
          console.error(`Failed to fetch Child Care Spaces: ${error}`, { error })
          return
        }

        throw error
      })
    },
    { deep: true, immediate: true }
  )

  onScopeDispose(() => {
    requestController?.abort()
  })

  return {
    ...toRefs(state),
    fetch,
    refresh: fetch,
  }
}

export default useChildCareSpaces
