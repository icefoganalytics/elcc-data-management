import { isCancel } from "axios"
import { onScopeDispose, reactive, toRefs, watch } from "vue"

import centresApi from "@/api/centres-api"

export type CentreStatistics = {
  centreCount: number
  communityCount: number
}

export function useCentreStatistics({
  skipWatchIf = () => false,
}: {
  skipWatchIf?: () => boolean
} = {}) {
  const state = reactive<{
    statistics: CentreStatistics | null
    isLoading: boolean
    isErrored: boolean
  }>({
    statistics: null,
    isLoading: true,
    isErrored: false,
  })
  let requestController: AbortController | undefined

  async function fetch(): Promise<CentreStatistics | undefined> {
    requestController?.abort()
    const controller = new AbortController()
    requestController = controller
    state.statistics = null
    state.isLoading = true
    state.isErrored = false

    try {
      const { totalCount, summaries } = await centresApi.list(
        { perPage: 1 },
        { signal: controller.signal }
      )
      if (controller.signal.aborted) return

      const statistics = {
        centreCount: totalCount,
        communityCount: summaries.communityCount,
      }
      state.statistics = statistics
      return statistics
    } catch (error) {
      if (controller.signal.aborted || isCancel(error)) return

      console.error(`Failed to fetch centre statistics: ${error}`, { error })
      state.isErrored = true
      throw error
    } finally {
      if (!controller.signal.aborted) {
        state.isLoading = false
      }
    }
  }

  onScopeDispose(() => {
    requestController?.abort()
  })

  watch(
    skipWatchIf,
    async (skip) => {
      if (skip) return

      await fetch()
    },
    { immediate: true }
  )

  return {
    ...toRefs(state),
    fetch,
    refresh: fetch,
  }
}

export default useCentreStatistics
