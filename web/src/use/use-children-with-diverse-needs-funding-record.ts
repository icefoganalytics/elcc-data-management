import { isCancel } from "axios"
import { onScopeDispose, reactive, toRefs, unref, watch } from "vue"
import type { Ref } from "vue"

import childrenWithDiverseNeedsFundingRecordsApi from "@/api/children-with-diverse-needs-funding-records-api"
import type { ChildrenWithDiverseNeedsFundingRecordAsShow } from "@/api/children-with-diverse-needs-funding-records-api"

export function useChildrenWithDiverseNeedsFundingRecord(
  childrenWithDiverseNeedsFundingRecordId: Ref<number>
) {
  const state = reactive<{
    childrenWithDiverseNeedsFundingRecord: ChildrenWithDiverseNeedsFundingRecordAsShow | null
    isLoading: boolean
    isErrored: boolean
  }>({
    childrenWithDiverseNeedsFundingRecord: null,
    isLoading: false,
    isErrored: false,
  })
  let requestController: AbortController | undefined

  async function fetch(): Promise<ChildrenWithDiverseNeedsFundingRecordAsShow | null> {
    requestController?.abort()
    const controller = new AbortController()
    requestController = controller
    state.isLoading = true
    try {
      const response = await childrenWithDiverseNeedsFundingRecordsApi.get(
        unref(childrenWithDiverseNeedsFundingRecordId),
        {
          signal: controller.signal,
        }
      )
      if (controller.signal.aborted) return state.childrenWithDiverseNeedsFundingRecord

      state.childrenWithDiverseNeedsFundingRecord = response.childrenWithDiverseNeedsFundingRecord
      state.isErrored = false
      return response.childrenWithDiverseNeedsFundingRecord
    } catch (error) {
      if (controller.signal.aborted || isCancel(error))
        return state.childrenWithDiverseNeedsFundingRecord

      state.isErrored = true
      throw error
    } finally {
      if (!controller.signal.aborted) {
        state.isLoading = false
      }
    }
  }

  watch(
    childrenWithDiverseNeedsFundingRecordId,
    async () => {
      try {
        await fetch()
      } catch {
        // Explicit refresh callers receive the rejection; watched failures use isErrored.
      }
    },
    { immediate: true }
  )

  onScopeDispose(() => {
    requestController?.abort()
  })

  async function save(
    attributes: Parameters<typeof childrenWithDiverseNeedsFundingRecordsApi.update>[1]
  ) {
    const response = await childrenWithDiverseNeedsFundingRecordsApi.update(
      unref(childrenWithDiverseNeedsFundingRecordId),
      attributes
    )
    state.childrenWithDiverseNeedsFundingRecord = response.childrenWithDiverseNeedsFundingRecord
    return response.childrenWithDiverseNeedsFundingRecord
  }

  return {
    ...toRefs(state),
    fetch,
    save,
  }
}

export default useChildrenWithDiverseNeedsFundingRecord
