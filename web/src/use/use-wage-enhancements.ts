import { reactive, ref, toRefs, unref, watch } from "vue"
import type { Ref } from "vue"

import wageEnhancementsApi, {
  type WageEnhancementAsIndex,
  type WageEnhancementQueryOptions,
} from "@/api/wage-enhancements-api"

export {
  EI_CPP_WCB_RATE,
  type WageEnhancement,
  type WageEnhancementAsIndex,
  type WageEnhancementQueryOptions,
  type WageEnhancementWhereOptions,
  type WageEnhancementFiltersOptions,
} from "@/api/wage-enhancements-api"

export function useWageEnhancements(
  queryOptions: Ref<WageEnhancementQueryOptions> = ref({}),
  { skipWatchIf = () => false }: { skipWatchIf?: () => boolean } = {}
) {
  const state = reactive<{
    wageEnhancements: WageEnhancementAsIndex[]
    totalCount: number
    isLoading: boolean
    isErrored: boolean
  }>({
    wageEnhancements: [],
    totalCount: 0,
    isLoading: false,
    isErrored: false,
  })

  let latestRequest = {}

  async function fetch(): Promise<WageEnhancementAsIndex[]> {
    const request = {}
    latestRequest = request
    state.isLoading = true
    state.isErrored = false
    try {
      const { wageEnhancements, totalCount } = await wageEnhancementsApi.list(unref(queryOptions))
      if (latestRequest === request) {
        state.wageEnhancements = wageEnhancements
        state.totalCount = totalCount
      }
      return wageEnhancements
    } catch (error) {
      console.error(`Failed to fetch wage enhancements: ${error}`, { error })
      if (latestRequest === request) state.isErrored = true
      throw error
    } finally {
      if (latestRequest === request) state.isLoading = false
    }
  }

  watch(
    () => [skipWatchIf(), unref(queryOptions)],
    async ([skip]) => {
      latestRequest = {}
      state.wageEnhancements = []
      state.totalCount = 0
      state.isLoading = false
      state.isErrored = false
      if (skip) return

      try {
        await fetch()
      } catch {
        // fetch() records the failure; explicit callers still receive its rejection.
      }
    },
    { deep: true, immediate: true, flush: "sync" }
  )

  return {
    ...toRefs(state),
    fetch,
    refresh: fetch,
  }
}

export default useWageEnhancements
