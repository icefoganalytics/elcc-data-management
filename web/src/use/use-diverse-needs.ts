import { isCancel } from "axios"
import { onScopeDispose, reactive, toRefs, unref, watch } from "vue"
import type { Ref } from "vue"

import diverseNeedsApi from "@/api/diverse-needs-api"
import type { DiverseNeedAsIndex, DiverseNeedQueryOptions } from "@/api/diverse-needs-api"

export function useDiverseNeeds(queryOptions: Ref<DiverseNeedQueryOptions>) {
  const state = reactive<{
    diverseNeeds: DiverseNeedAsIndex[]
    totalCount: number
    isLoading: boolean
    isErrored: boolean
  }>({
    diverseNeeds: [],
    totalCount: 0,
    isLoading: false,
    isErrored: false,
  })
  let requestController: AbortController | undefined

  async function fetch(): Promise<DiverseNeedAsIndex[]> {
    requestController?.abort()
    const controller = new AbortController()
    requestController = controller
    state.isLoading = true
    try {
      const response = await diverseNeedsApi.list(unref(queryOptions), {
        signal: controller.signal,
      })
      if (controller.signal.aborted) return state.diverseNeeds

      state.diverseNeeds = response.diverseNeeds
      state.totalCount = response.totalCount
      state.isErrored = false
      return response.diverseNeeds
    } catch (error) {
      if (controller.signal.aborted || isCancel(error)) return state.diverseNeeds

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

export default useDiverseNeeds
