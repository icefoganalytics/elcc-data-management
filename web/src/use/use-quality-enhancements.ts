import { isCancel } from "axios"
import { onScopeDispose, reactive, ref, toRefs, unref, watch, type Ref } from "vue"
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
  let requestController: AbortController | undefined

  async function fetch(): Promise<QualityEnhancementAsIndex[]> {
    requestController?.abort()
    const controller = new AbortController()
    requestController = controller
    state.isLoading = true
    state.isErrored = false
    try {
      const { qualityEnhancements, totalCount } = await qualityEnhancementsApi.list(
        unref(queryOptions),
        { signal: controller.signal }
      )
      if (controller.signal.aborted) {
        return state.qualityEnhancements
      }

      state.qualityEnhancements = qualityEnhancements
      state.totalCount = totalCount
      return qualityEnhancements
    } catch (error) {
      if (controller.signal.aborted || isCancel(error)) {
        return state.qualityEnhancements
      }

      console.error(`Failed to fetch Quality Enhancements: ${error}`, { error })
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
      state.qualityEnhancements = []
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

export default useQualityEnhancements
