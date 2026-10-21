import { type Ref, reactive, ref, toRefs, unref, watch } from "vue"

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
  let latestRequest = {}

  async function fetch(): Promise<QualityEnhancementCategoryAsIndex[]> {
    const request = {}
    latestRequest = request
    const query = unref(queryOptions)
    state.isLoading = true
    try {
      const { qualityEnhancementCategories, totalCount } =
        await qualityEnhancementCategoriesApi.list(query)
      if (latestRequest === request) {
        state.isErrored = false
        state.qualityEnhancementCategories = qualityEnhancementCategories
        state.totalCount = totalCount
      }
      return qualityEnhancementCategories
    } catch (error) {
      console.error(`Failed to fetch Quality Enhancement categories: ${error}`, { error })
      if (latestRequest === request) {
        state.isErrored = true
      }
      throw error
    } finally {
      if (latestRequest === request) {
        state.isLoading = false
      }
    }
  }

  watch(
    () => [skipWatchIf(), unref(queryOptions)],
    async ([skip]) => {
      if (skip) {
        return
      }

      try {
        await fetch()
      } catch {
        // fetch() preserves rejection for explicit callers; watcher requests are expected to fail.
      }
    },
    { deep: true, immediate: true }
  )

  return {
    ...toRefs(state),
    fetch,
    refresh: fetch,
  }
}

export default useQualityEnhancementCategories
