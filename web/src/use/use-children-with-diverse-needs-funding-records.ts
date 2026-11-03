import { isCancel } from "axios"
import { onScopeDispose, reactive, toRefs, unref, watch } from "vue"
import type { Ref } from "vue"

import childrenWithDiverseNeedsFundingRecordsApi from "@/api/children-with-diverse-needs-funding-records-api"
import type {
  ChildrenWithDiverseNeedsFundingRecordAsIndex,
  ChildrenWithDiverseNeedsFundingRecordQueryOptions,
} from "@/api/children-with-diverse-needs-funding-records-api"

export function useChildrenWithDiverseNeedsFundingRecords(
  queryOptions: Ref<ChildrenWithDiverseNeedsFundingRecordQueryOptions>
) {
  const state = reactive<{
    childrenWithDiverseNeedsFundingRecords: ChildrenWithDiverseNeedsFundingRecordAsIndex[]
    totalCount: number
    isLoading: boolean
    isErrored: boolean
  }>({
    childrenWithDiverseNeedsFundingRecords: [],
    totalCount: 0,
    isLoading: false,
    isErrored: false,
  })
  let requestController: AbortController | undefined

  async function fetch(): Promise<ChildrenWithDiverseNeedsFundingRecordAsIndex[]> {
    requestController?.abort()
    const controller = new AbortController()
    requestController = controller
    state.isLoading = true
    try {
      const response = await childrenWithDiverseNeedsFundingRecordsApi.list(unref(queryOptions), {
        signal: controller.signal,
      })
      if (controller.signal.aborted) return state.childrenWithDiverseNeedsFundingRecords

      state.childrenWithDiverseNeedsFundingRecords = response.childrenWithDiverseNeedsFundingRecords
      state.totalCount = response.totalCount
      state.isErrored = false
      return response.childrenWithDiverseNeedsFundingRecords
    } catch (error) {
      if (controller.signal.aborted || isCancel(error))
        return state.childrenWithDiverseNeedsFundingRecords

      state.isErrored = true
      throw error
    } finally {
      if (!controller.signal.aborted) {
        state.isLoading = false
      }
    }
  }

  watch(queryOptions, fetchWithoutSurfacingWatchFailure, { deep: true, immediate: true })

  async function fetchWithoutSurfacingWatchFailure() {
    try {
      await fetch()
    } catch {
      // Explicit refresh callers receive the rejection; watched failures use isErrored.
    }
  }

  onScopeDispose(() => {
    requestController?.abort()
  })

  return {
    ...toRefs(state),
    fetch,
  }
}

export default useChildrenWithDiverseNeedsFundingRecords
