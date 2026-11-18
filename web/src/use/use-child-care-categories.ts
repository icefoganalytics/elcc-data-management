import { isCancel } from "axios"
import { onScopeDispose, reactive, ref, toRefs, unref, watch, type Ref } from "vue"

import childCareCategoriesApi, {
  type ChildCareCategoryAsIndex,
  type ChildCareCategoryFiltersOptions,
  type ChildCareCategoryQueryOptions,
  type ChildCareCategoryWhereOptions,
} from "@/api/child-care-categories-api"
import rethrowUnexpectedError from "@/api/errors/rethrow-unexpected-error"

export {
  type ChildCareCategoryAsIndex,
  type ChildCareCategoryFiltersOptions,
  type ChildCareCategoryQueryOptions,
  type ChildCareCategoryWhereOptions,
}

export function useChildCareCategories(
  queryOptions: Ref<ChildCareCategoryQueryOptions> = ref({}),
  { skipWatchIf = () => false }: { skipWatchIf?: () => boolean } = {}
) {
  const state = reactive<{
    childCareCategories: ChildCareCategoryAsIndex[]
    totalCount: number
    isLoading: boolean
    isErrored: boolean
  }>({
    childCareCategories: [],
    totalCount: 0,
    isLoading: false,
    isErrored: false,
  })
  let requestController: AbortController | undefined

  async function fetch(): Promise<ChildCareCategoryAsIndex[]> {
    requestController?.abort()
    const controller = new AbortController()
    requestController = controller
    state.isLoading = true
    state.isErrored = false
    try {
      const { childCareCategories, totalCount } = await childCareCategoriesApi.list(
        unref(queryOptions),
        {
          signal: controller.signal,
        }
      )
      if (controller.signal.aborted) {
        return state.childCareCategories
      }

      state.childCareCategories = childCareCategories
      state.totalCount = totalCount
      return childCareCategories
    } catch (error) {
      if (controller.signal.aborted || isCancel(error)) {
        return state.childCareCategories
      }

      state.isErrored = true
      rethrowUnexpectedError(error)
      console.error(`Failed to fetch Child Care categories: ${error}`, { error })
      return state.childCareCategories
    } finally {
      state.isLoading = false
    }
  }

  watch(
    () => [skipWatchIf(), unref(queryOptions)],
    async ([skip]) => {
      state.childCareCategories = []
      state.totalCount = 0
      state.isLoading = false
      state.isErrored = false
      if (skip) {
        requestController?.abort()
        return
      }

      await fetch()
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

export default useChildCareCategories
