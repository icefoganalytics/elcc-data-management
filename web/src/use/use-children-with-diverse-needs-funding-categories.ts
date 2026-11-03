import { isCancel } from "axios"
import { onScopeDispose, reactive, toRefs, unref, watch } from "vue"
import type { Ref } from "vue"

import childrenWithDiverseNeedsFundingCategoriesApi from "@/api/children-with-diverse-needs-funding-categories-api"
import type {
  ChildrenWithDiverseNeedsFundingCategoryAsIndex,
  ChildrenWithDiverseNeedsFundingCategoryQueryOptions,
} from "@/api/children-with-diverse-needs-funding-categories-api"

export function useChildrenWithDiverseNeedsFundingCategories(
  queryOptions: Ref<ChildrenWithDiverseNeedsFundingCategoryQueryOptions>
) {
  const state = reactive<{
    childrenWithDiverseNeedsFundingCategories: ChildrenWithDiverseNeedsFundingCategoryAsIndex[]
    totalCount: number
    isLoading: boolean
    isErrored: boolean
  }>({
    childrenWithDiverseNeedsFundingCategories: [],
    totalCount: 0,
    isLoading: false,
    isErrored: false,
  })
  let requestController: AbortController | undefined

  async function fetch(): Promise<ChildrenWithDiverseNeedsFundingCategoryAsIndex[]> {
    requestController?.abort()
    const controller = new AbortController()
    requestController = controller
    state.isLoading = true
    try {
      const response = await childrenWithDiverseNeedsFundingCategoriesApi.list(
        unref(queryOptions),
        {
          signal: controller.signal,
        }
      )
      if (controller.signal.aborted) return state.childrenWithDiverseNeedsFundingCategories

      state.childrenWithDiverseNeedsFundingCategories =
        response.childrenWithDiverseNeedsFundingCategories
      state.totalCount = response.totalCount
      state.isErrored = false
      return response.childrenWithDiverseNeedsFundingCategories
    } catch (error) {
      if (controller.signal.aborted || isCancel(error))
        return state.childrenWithDiverseNeedsFundingCategories

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

export default useChildrenWithDiverseNeedsFundingCategories
