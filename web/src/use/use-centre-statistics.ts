import { isCancel } from "axios"
import { onScopeDispose, reactive, toRefs, watch } from "vue"

import { MAX_PER_PAGE } from "@/api/base-api"
import centresApi from "@/api/centres-api"

export type CentreStatistics = {
  centreCount: number
  communityCount: number
}

export function useCentreStatistics({
  skipWatchIf = () => false,
  onError,
}: {
  skipWatchIf?: () => boolean
  onError?: (error: unknown) => void
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
      const communities = new Set<string>()
      let centreCount = 0
      let page = 1
      let hasMoreCentres = true

      // The API caps every page, including perPage: -1. Count all authorized centres.
      while (hasMoreCentres) {
        const { centres, totalCount } = await centresApi.list(
          {
            order: [["id", "ASC"]],
            page,
            perPage: MAX_PER_PAGE,
          },
          { signal: controller.signal }
        )
        if (controller.signal.aborted) return

        centreCount += centres.length
        for (const centre of centres) {
          communities.add(centre.community)
        }
        hasMoreCentres = centres.length > 0 && centreCount < totalCount
        page += 1
      }

      const statistics = { centreCount, communityCount: communities.size }
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

      try {
        await fetch()
      } catch (error) {
        if (onError) {
          onError(error)
          return
        }
        throw error
      }
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
