import { isCancel } from "axios"
import { onScopeDispose, reactive, toRefs, unref, watch } from "vue"
import type { Ref } from "vue"

import childrenWithChildrenWithDiverseNeedsFundingRecordsApi from "@/api/children-with-diverse-needs-funding-records-api"
import type { ChildrenWithDiverseNeedsFundingRecordAsShow } from "@/api/children-with-diverse-needs-funding-records-api"

export function useChildrenWithDiverseNeedsFundingRecord(childrenWithChildrenWithDiverseNeedsFundingRecordsRecordId: Ref<number>) {
  const state = reactive<{
    childrenWithChildrenWithDiverseNeedsFundingRecordsRecord: ChildrenWithDiverseNeedsFundingRecordAsShow | null
    isLoading: boolean
    isErrored: boolean
  }>({
    childrenWithChildrenWithDiverseNeedsFundingRecordsRecord: null,
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
      const response = await childrenWithChildrenWithDiverseNeedsFundingRecordsApi.get(
        unref(childrenWithChildrenWithDiverseNeedsFundingRecordsRecordId),
        {
          signal: controller.signal,
        }
      )
      if (controller.signal.aborted) return state.childrenWithChildrenWithDiverseNeedsFundingRecordsRecord

      state.childrenWithChildrenWithDiverseNeedsFundingRecordsRecord = response.childrenWithChildrenWithDiverseNeedsFundingRecordsRecord
      state.isErrored = false
      return response.childrenWithChildrenWithDiverseNeedsFundingRecordsRecord
    } catch (error) {
      if (controller.signal.aborted || isCancel(error)) return state.childrenWithChildrenWithDiverseNeedsFundingRecordsRecord

      state.isErrored = true
      throw error
    } finally {
      if (!controller.signal.aborted) {
        state.isLoading = false
      }
    }
  }

  watch(
    childrenWithChildrenWithDiverseNeedsFundingRecordsRecordId,
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

  async function save(attributes: Parameters<typeof childrenWithChildrenWithDiverseNeedsFundingRecordsApi.update>[1]) {
    const response = await childrenWithChildrenWithDiverseNeedsFundingRecordsApi.update(
      unref(childrenWithChildrenWithDiverseNeedsFundingRecordsRecordId),
      attributes
    )
    state.childrenWithChildrenWithDiverseNeedsFundingRecordsRecord = response.childrenWithChildrenWithDiverseNeedsFundingRecordsRecord
    return response.childrenWithChildrenWithDiverseNeedsFundingRecordsRecord
  }

  return {
    ...toRefs(state),
    fetch,
    save,
  }
}

export default useChildrenWithDiverseNeedsFundingRecord
