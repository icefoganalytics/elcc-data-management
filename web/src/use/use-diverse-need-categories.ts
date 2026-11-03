import { isCancel } from "axios"
import { onScopeDispose, reactive, toRefs, unref, watch } from "vue"
import type { Ref } from "vue"

import diverseNeedCategoriesApi from "@/api/diverse-need-categories-api"
import type {
  DiverseNeedCategoryAsIndex,
  DiverseNeedCategoryQueryOptions,
} from "@/api/diverse-need-categories-api"

export function useDiverseNeedCategories(queryOptions: Ref<DiverseNeedCategoryQueryOptions>) {
  const state = reactive<{
    diverseNeedCategories: DiverseNeedCategoryAsIndex[]
    totalCount: number
    isLoading: boolean
    isErrored: boolean
  }>({
    diverseNeedCategories: [],
    totalCount: 0,
    isLoading: false,
    isErrored: false,
  })
  let requestController: AbortController | undefined

  async function fetch(): Promise<DiverseNeedCategoryAsIndex[]> {
    requestController?.abort()
    const controller = new AbortController()
    requestController = controller
    state.isLoading = true
    try {
      const response = await diverseNeedCategoriesApi.list(unref(queryOptions), {
        signal: controller.signal,
      })
      if (controller.signal.aborted) return state.diverseNeedCategories

      state.diverseNeedCategories = response.diverseNeedCategories
      state.totalCount = response.totalCount
      state.isErrored = false
      return response.diverseNeedCategories
    } catch (error) {
      if (controller.signal.aborted || isCancel(error)) return state.diverseNeedCategories

      state.isErrored = true
      throw error
    } finally {
      if (!controller.signal.aborted) state.isLoading = false
    }
  }

  watch(
    queryOptions,
    async () => {
      try {
        await fetch()
      } catch {
        // Explicit refresh callers receive the rejection; watched failures use isErrored.
      }
    },
    { deep: true, immediate: true }
  )

  onScopeDispose(() => requestController?.abort())

  return { ...toRefs(state), fetch }
}

export default useDiverseNeedCategories
