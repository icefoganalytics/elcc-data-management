import { type Ref, reactive, ref, toRefs, unref, watch } from "vue"

import qualityEnhancementsApi, {
  type QualityEnhancementAsIndex,
  type QualityEnhancementFiltersOptions,
  type QualityEnhancementQueryOptions,
  type QualityEnhancementWhereOptions,
} from "@/api/quality-enhancements-api"

export {
  type QualityEnhancementAsIndex,
  type QualityEnhancementFiltersOptions,
  type QualityEnhancementQueryOptions,
  type QualityEnhancementWhereOptions,
}

export function useQualityEnhancements(
  queryOptions: Ref<QualityEnhancementQueryOptions> = ref({}),
  { skipWatchIf = () => false }: { skipWatchIf?: () => boolean } = {}
) {
  const state = reactive<{
    qualityEnhancements: QualityEnhancementAsIndex[]
    totalCount: number
    isLoading: boolean
    isErrored: boolean
  }>({
    qualityEnhancements: [],
    totalCount: 0,
    isLoading: false,
    isErrored: false,
  })
  let latestRequest = {}

  async function fetch(): Promise<QualityEnhancementAsIndex[]> {
    const request = {}
    latestRequest = request
    const query = unref(queryOptions)
    state.isLoading = true
    try {
      const { qualityEnhancements, totalCount } = await qualityEnhancementsApi.list(query)
      if (latestRequest === request) {
        state.isErrored = false
        state.qualityEnhancements = qualityEnhancements
        state.totalCount = totalCount
      }
      return qualityEnhancements
    } catch (error) {
      console.error(`Failed to fetch Quality Enhancements: ${error}`, { error })
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

export default useQualityEnhancements
