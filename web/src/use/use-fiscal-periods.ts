import { isCancel } from "axios"
import { type Ref, onScopeDispose, reactive, toRefs, ref, unref, watch } from "vue"

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
  let requestController: AbortController | undefined

  async function fetch(): Promise<FiscalPeriod[]> {
    requestController?.abort()
    const controller = new AbortController()
    requestController = controller
    state.isLoading = true
    try {
      const { fiscalPeriods, totalCount } = await fiscalPeriodsApi.list(unref(queryOptions), {
        signal: controller.signal,
      })
      if (controller.signal.aborted) {
        return state.fiscalPeriods
      }

      state.isErrored = false
      state.fiscalPeriods = fiscalPeriods
      state.totalCount = totalCount
      return fiscalPeriods
    } catch (error) {
      if (controller.signal.aborted || isCancel(error)) {
        return state.fiscalPeriods
      }

      console.error(`Failed to fetch fiscal periods: ${error}`, { error })
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
      state.fiscalPeriods = []
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
        // fetch() records the failure; explicit callers still receive its rejection.
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

export default useFiscalPeriods
