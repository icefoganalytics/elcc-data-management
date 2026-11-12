import { isCancel } from "axios"
import { onScopeDispose, reactive, toRefs, unref, watch } from "vue"
import type { Ref } from "vue"

import childrenWithDiverseNeedsFundingCategoriesApi from "@/api/children-with-diverse-needs-funding-categories-api"
import type {
  ChildrenWithDiverseNeedsFundingCategoryAsIndex,
  ChildrenWithDiverseNeedsFundingCategoryQueryOptions,
} from "@/api/children-with-diverse-needs-funding-categories-api"
import rethrowUnexpectedError from "@/api/errors/rethrow-unexpected-error"

import useSnack from "@/use/use-snack"

export function useChildrenWithDiverseNeedsFundingCategories(
  queryOptions: Ref<ChildrenWithDiverseNeedsFundingCategoryQueryOptions>,
  { skipWatchIf = () => false }: { skipWatchIf?: () => boolean } = {}
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
    state.isErrored = false

    try {
      const { childrenWithDiverseNeedsFundingCategories, totalCount } =
        await childrenWithDiverseNeedsFundingCategoriesApi.list(unref(queryOptions), {
          signal: controller.signal,
        })
      if (controller.signal.aborted) {
        return state.childrenWithDiverseNeedsFundingCategories
      }

      state.childrenWithDiverseNeedsFundingCategories = childrenWithDiverseNeedsFundingCategories
      state.totalCount = totalCount
      state.isErrored = false
      return childrenWithDiverseNeedsFundingCategories
    } catch (error) {
      if (controller.signal.aborted || isCancel(error)) {
        return state.childrenWithDiverseNeedsFundingCategories
      }

      state.isErrored = true
      console.error("Failed to fetch Children with Diverse Needs funding categories", { error })
      throw error
    } finally {
      if (!controller.signal.aborted) state.isLoading = false
    }
  }

  const snack = useSnack()
  watch(
    () => [skipWatchIf(), unref(queryOptions)],
    async ([skip]) => {
      state.childrenWithDiverseNeedsFundingCategories = []
      state.totalCount = 0
      state.isErrored = false
      state.isLoading = false
      if (skip) {
        requestController?.abort()
        return
      }

      try {
        await fetch()
      } catch (error) {
        rethrowUnexpectedError(error)

        snack.error(`Failed to load Children with Diverse Needs funding categories: ${error}`)
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

export default useChildrenWithDiverseNeedsFundingCategories
