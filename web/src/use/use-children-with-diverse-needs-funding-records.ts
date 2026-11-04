import { isCancel } from "axios"
import { onScopeDispose, reactive, toRefs, unref, watch } from "vue"
import type { Ref } from "vue"

import childrenWithDiverseNeedsFundingRecordsApi from "@/api/children-with-diverse-needs-funding-records-api"
import type {
  ChildrenWithDiverseNeedsFundingRecordAsIndex,
  ChildrenWithDiverseNeedsFundingRecordQueryOptions,
} from "@/api/children-with-diverse-needs-funding-records-api"
import rethrowUnexpectedError from "@/api/errors/rethrow-unexpected-error"

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
    state.isErrored = false

    try {
      const { childrenWithDiverseNeedsFundingRecords, totalCount } =
        await childrenWithDiverseNeedsFundingRecordsApi.list(unref(queryOptions), {
          signal: controller.signal,
        })
      if (controller.signal.aborted) return state.childrenWithDiverseNeedsFundingRecords

      state.childrenWithDiverseNeedsFundingRecords = childrenWithDiverseNeedsFundingRecords
      state.totalCount = totalCount
      state.isErrored = false
      return childrenWithDiverseNeedsFundingRecords
    } catch (error) {
      if (controller.signal.aborted || isCancel(error)) {
        return state.childrenWithDiverseNeedsFundingRecords
      }

      state.isErrored = true
      console.error("Failed to fetch Children with Diverse Needs funding records", { error })
      throw error
    } finally {
      if (!controller.signal.aborted) {
        state.isLoading = false
      }
    }
  }

  watch(
    queryOptions,
    async () => {
      state.childrenWithDiverseNeedsFundingRecords = []
      state.totalCount = 0

      try {
        await fetch()
      } catch (error) {
        rethrowUnexpectedError(error)
      }
    },
    {
      deep: true,
      immediate: true,
    }
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

export default useChildrenWithDiverseNeedsFundingRecords
