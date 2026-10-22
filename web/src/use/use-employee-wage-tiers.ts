import { reactive, ref, toRefs, unref, watch } from "vue"
import type { Ref } from "vue"

import employeeWageTiersApi, {
  type EmployeeWageTierAsIndex,
  type EmployeeWageTierQueryOptions,
} from "@/api/employee-wage-tiers-api"

export {
  type EmployeeWageTier,
  type EmployeeWageTierAsIndex,
  type EmployeeWageTierQueryOptions,
  type EmployeeWageTierWhereOptions,
  type EmployeeWageTierFiltersOptions,
} from "@/api/employee-wage-tiers-api"

export function useEmployeeWageTiers(
  queryOptions: Ref<EmployeeWageTierQueryOptions> = ref({}),
  { skipWatchIf = () => false }: { skipWatchIf?: () => boolean } = {}
) {
  const state = reactive<{
    employeeWageTiers: EmployeeWageTierAsIndex[]
    totalCount: number
    isLoading: boolean
    isErrored: boolean
  }>({
    employeeWageTiers: [],
    totalCount: 0,
    isLoading: false,
    isErrored: false,
  })
  let latestRequest = {}

  async function fetch(): Promise<EmployeeWageTierAsIndex[]> {
    const request = {}
    latestRequest = request
    state.isLoading = true
    try {
      const { employeeWageTiers, totalCount } = await employeeWageTiersApi.list(unref(queryOptions))
      if (latestRequest === request) {
        state.isErrored = false
        state.employeeWageTiers = employeeWageTiers
        state.totalCount = totalCount
      }
      return employeeWageTiers
    } catch (error) {
      console.error(`Failed to fetch employee wage tiers: ${error}`, { error })
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
      state.employeeWageTiers = []
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

export default useEmployeeWageTiers
