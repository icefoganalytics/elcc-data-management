import { type Ref, reactive, toRefs, ref, unref, watch } from "vue"

import employeeBenefitsApi, {
  type EmployeeBenefit,
  type EmployeeBenefitWhereOptions,
  type EmployeeBenefitFiltersOptions,
  type EmployeeBenefitQueryOptions,
} from "@/api/employee-benefits-api"

export {
  type EmployeeBenefit,
  type EmployeeBenefitWhereOptions,
  type EmployeeBenefitFiltersOptions,
  type EmployeeBenefitQueryOptions,
}

export function useEmployeeBenefits(
  queryOptions: Ref<EmployeeBenefitQueryOptions> = ref({}),
  { skipWatchIf = () => false }: { skipWatchIf?: () => boolean } = {}
) {
  const state = reactive<{
    employeeBenefits: EmployeeBenefit[]
    totalCount: number
    isLoading: boolean
    isErrored: boolean
  }>({
    employeeBenefits: [],
    totalCount: 0,
    isLoading: false,
    isErrored: false,
  })
  let latestRequest = {}

  async function fetch(): Promise<EmployeeBenefit[]> {
    const request = {}
    latestRequest = request
    state.isLoading = true
    try {
      const { employeeBenefits, totalCount } = await employeeBenefitsApi.list(unref(queryOptions))
      if (latestRequest === request) {
        state.isErrored = false
        state.employeeBenefits = employeeBenefits
        state.totalCount = totalCount
      }
      return employeeBenefits
    } catch (error) {
      console.error(`Failed to fetch employee benefits: ${error}`, { error })
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
      state.employeeBenefits = []
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

export default useEmployeeBenefits
