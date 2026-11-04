import { isCancel } from "axios"
import { isNil } from "lodash"
import { onScopeDispose, reactive, toRefs, unref, watch } from "vue"
import type { Ref } from "vue"

import childrenWithDiverseNeedsFundingRecordsApi from "@/api/children-with-diverse-needs-funding-records-api"
import type {
  ChildrenWithDiverseNeedsFundingRecordAsShow,
  ChildrenWithDiverseNeedsFundingRecordOccupancyAttributes,
  ChildrenWithDiverseNeedsFundingRecordPolicy,
} from "@/api/children-with-diverse-needs-funding-records-api"
import rethrowUnexpectedError from "@/api/errors/rethrow-unexpected-error"

export function useChildrenWithDiverseNeedsFundingRecord(
  childrenWithDiverseNeedsFundingRecordId: Ref<number | null | undefined>
) {
  const state = reactive<{
    childrenWithDiverseNeedsFundingRecord: ChildrenWithDiverseNeedsFundingRecordAsShow | null
    policy: ChildrenWithDiverseNeedsFundingRecordPolicy | null
    isLoading: boolean
    isErrored: boolean
  }>({
    childrenWithDiverseNeedsFundingRecord: null,
    policy: null,
    isLoading: false,
    isErrored: false,
  })

  let requestController: AbortController | undefined

  function clearRecord() {
    requestController?.abort()
    requestController = undefined
    state.childrenWithDiverseNeedsFundingRecord = null
    state.policy = null
    state.isErrored = false
    state.isLoading = false
  }

  async function fetch(): Promise<ChildrenWithDiverseNeedsFundingRecordAsShow | null> {
    const id = unref(childrenWithDiverseNeedsFundingRecordId)
    if (isNil(id)) throw new Error("childrenWithDiverseNeedsFundingRecordId is required")

    requestController?.abort()

    const controller = new AbortController()
    requestController = controller
    state.isLoading = true
    state.isErrored = false

    try {
      const response = await childrenWithDiverseNeedsFundingRecordsApi.get(id, {
        signal: controller.signal,
      })
      if (controller.signal.aborted || unref(childrenWithDiverseNeedsFundingRecordId) !== id) {
        return state.childrenWithDiverseNeedsFundingRecord
      }

      state.childrenWithDiverseNeedsFundingRecord = response.childrenWithDiverseNeedsFundingRecord
      state.policy = response.policy
      state.isErrored = false
      return response.childrenWithDiverseNeedsFundingRecord
    } catch (error) {
      if (controller.signal.aborted || isCancel(error))
        return state.childrenWithDiverseNeedsFundingRecord

      console.error("Failed to fetch Children with Diverse Needs funding record", { error })
      if (unref(childrenWithDiverseNeedsFundingRecordId) === id) {
        state.isErrored = true
      }
      throw error
    } finally {
      if (!controller.signal.aborted && unref(childrenWithDiverseNeedsFundingRecordId) === id) {
        state.isLoading = false
      }
    }
  }

  async function save(
    attributes: ChildrenWithDiverseNeedsFundingRecordOccupancyAttributes
  ): Promise<ChildrenWithDiverseNeedsFundingRecordAsShow> {
    const id = unref(childrenWithDiverseNeedsFundingRecordId)
    if (isNil(id)) throw new Error("childrenWithDiverseNeedsFundingRecordId is required")

    if (state.childrenWithDiverseNeedsFundingRecord?.id !== id) {
      throw new Error("The requested Children with Diverse Needs funding record is not loaded")
    }

    requestController?.abort()

    const controller = new AbortController()
    requestController = controller
    state.isLoading = true
    state.isErrored = false

    try {
      const response = await childrenWithDiverseNeedsFundingRecordsApi.update(id, attributes)
      if (!controller.signal.aborted && unref(childrenWithDiverseNeedsFundingRecordId) === id) {
        state.childrenWithDiverseNeedsFundingRecord = response.childrenWithDiverseNeedsFundingRecord
        state.policy = response.policy
      }
      return response.childrenWithDiverseNeedsFundingRecord
    } catch (error) {
      console.error("Failed to save Children with Diverse Needs funding record", { error })
      if (!controller.signal.aborted && unref(childrenWithDiverseNeedsFundingRecordId) === id) {
        state.isErrored = true
      }
      throw error
    } finally {
      if (!controller.signal.aborted && unref(childrenWithDiverseNeedsFundingRecordId) === id) {
        state.isLoading = false
      }
    }
  }

  watch(
    () => unref(childrenWithDiverseNeedsFundingRecordId),
    async (id) => {
      clearRecord()
      if (isNil(id)) return

      try {
        await fetch()
      } catch (error) {
        rethrowUnexpectedError(error)
      }
    },
    {
      immediate: true,
    }
  )

  onScopeDispose(() => {
    requestController?.abort()
  })

  return {
    ...toRefs(state),
    fetch,
    save,
  }
}

export default useChildrenWithDiverseNeedsFundingRecord
