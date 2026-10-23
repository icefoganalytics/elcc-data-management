import { isCancel } from "axios"
import { onScopeDispose, reactive, ref, toRefs, unref, watch, type Ref } from "vue"
import qualityEnhancementCategoriesApi, {
  type QualityEnhancementCategoryAsIndex,
  type QualityEnhancementCategoryFiltersOptions,
  type QualityEnhancementCategoryQueryOptions,
  type QualityEnhancementCategoryWhereOptions,
} from "@/api/quality-enhancement-categories-api"

export {
  type QualityEnhancementCategoryAsIndex,
  type QualityEnhancementCategoryFiltersOptions,
  type QualityEnhancementCategoryQueryOptions,
  type QualityEnhancementCategoryWhereOptions,
}

export function useQualityEnhancementCategories(
  queryOptions: Ref<QualityEnhancementCategoryQueryOptions> = ref({}),
  { skipWatchIf = () => false }: { skipWatchIf?: () => boolean } = {}
) {
  const state = reactive<{
    qualityEnhancementCategories: QualityEnhancementCategoryAsIndex[]
    totalCount: number
    isLoading: boolean
    isErrored: boolean
  }>({
    qualityEnhancementCategories: [],
    totalCount: 0,
    isLoading: false,
    isErrored: false,
  })
  let requestController: AbortController | undefined

  async function fetch(): Promise<QualityEnhancementCategoryAsIndex[]> {
    requestController?.abort()
    const controller = new AbortController()
    requestController = controller
    state.isLoading = true
    state.isErrored = false
    try {
      const { qualityEnhancementCategories, totalCount } =
        await qualityEnhancementCategoriesApi.list(unref(queryOptions), {
          signal: controller.signal,
        })
      if (controller.signal.aborted) {
        return state.qualityEnhancementCategories
      }

      state.qualityEnhancementCategories = qualityEnhancementCategories
      state.totalCount = totalCount
      return qualityEnhancementCategories
    } catch (error) {
      if (controller.signal.aborted || isCancel(error)) {
        return state.qualityEnhancementCategories
      }

      console.error(`Failed to fetch Quality Enhancement categories: ${error}`, { error })
      state.isErrored = true
      throw error
    } finally {
      if (!controller.signal.aborted) {
        state.isLoading = false
      }
    }
  }

  watch(
    () => [skipWatchIf(), unref(queryOptions)],
    async ([skip]) => {
      state.qualityEnhancementCategories = []
      state.totalCount = 0
      state.isLoading = false
      state.isErrored = false
      if (skip) {
        requestController?.abort()
        return
      }

      try {
        await fetch()
      } catch {
        // fetch() preserves rejection for explicit callers; watcher failures use isErrored.
      }
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

export default useQualityEnhancementCategories
