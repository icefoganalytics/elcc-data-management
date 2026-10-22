import { type Ref, reactive, toRefs, ref, unref, watch } from "vue"

import fiscalPeriodsApi, {
  FiscalPeriodMonths,
  type FiscalPeriod,
  type FiscalPeriodWhereOptions,
  type FiscalPeriodFiltersOptions,
} from "@/api/fiscal-periods-api"

export {
  FiscalPeriodMonths,
  type FiscalPeriod,
  type FiscalPeriodWhereOptions,
  type FiscalPeriodFiltersOptions,
}

export function useFiscalPeriods(
  queryOptions: Ref<{
    where?: FiscalPeriodWhereOptions
    filters?: FiscalPeriodFiltersOptions
    page?: number
    perPage?: number
  }> = ref({}),
  { skipWatchIf = () => false }: { skipWatchIf?: () => boolean } = {}
) {
  const state = reactive<{
    fiscalPeriods: FiscalPeriod[]
    totalCount: number
    isLoading: boolean
    isErrored: boolean
  }>({
    fiscalPeriods: [],
    totalCount: 0,
    isLoading: false,
    isErrored: false,
  })
  let latestRequest = {}

  async function fetch(): Promise<FiscalPeriod[]> {
    const request = {}
    latestRequest = request
    state.isLoading = true
    try {
      const { fiscalPeriods, totalCount } = await fiscalPeriodsApi.list(unref(queryOptions))
      if (latestRequest === request) {
        state.isErrored = false
        state.fiscalPeriods = fiscalPeriods
        state.totalCount = totalCount
      }
      return fiscalPeriods
    } catch (error) {
      console.error(`Failed to fetch fiscal periods: ${error}`, { error })
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
      latestRequest = {}
      state.fiscalPeriods = []
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

export default useFiscalPeriods
