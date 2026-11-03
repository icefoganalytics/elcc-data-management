import { isCancel } from "axios"
import { onScopeDispose, reactive, toRefs, unref, watch } from "vue"
import type { Ref } from "vue"

import diverseNeedsApi from "@/api/diverse-needs-api"
import type { DiverseNeedAsShow } from "@/api/diverse-needs-api"

export function useDiverseNeed(diverseNeedId: Ref<number>) {
  const state = reactive<{
    diverseNeed: DiverseNeedAsShow | null
    isLoading: boolean
    isErrored: boolean
  }>({
    diverseNeed: null,
    isLoading: false,
    isErrored: false,
  })
  let requestController: AbortController | undefined

  async function fetch(): Promise<DiverseNeedAsShow | null> {
    requestController?.abort()
    const controller = new AbortController()
    requestController = controller
    state.isLoading = true
    try {
      const response = await diverseNeedsApi.get(unref(diverseNeedId), {
        signal: controller.signal,
      })
      if (controller.signal.aborted) return state.diverseNeed

      state.diverseNeed = response.diverseNeed
      state.isErrored = false
      return response.diverseNeed
    } catch (error) {
      if (controller.signal.aborted || isCancel(error)) return state.diverseNeed

      state.isErrored = true
      throw error
    } finally {
      if (!controller.signal.aborted) {
        state.isLoading = false
      }
    }
  }

  watch(
    diverseNeedId,
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

  async function save(attributes: Parameters<typeof diverseNeedsApi.update>[1]) {
    const response = await diverseNeedsApi.update(unref(diverseNeedId), attributes)
    state.diverseNeed = response.diverseNeed
    return response.diverseNeed
  }

  return {
    ...toRefs(state),
    fetch,
    save,
  }
}

export default useDiverseNeed
