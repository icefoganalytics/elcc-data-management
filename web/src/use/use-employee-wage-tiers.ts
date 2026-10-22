import { isCancel } from "axios"
import { onScopeDispose, reactive, ref, toRefs, unref, watch } from "vue"
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
  let requestController: AbortController | undefined

  async function fetch(): Promise<EmployeeWageTierAsIndex[]> {
    requestController?.abort()
    const controller = new AbortController()
    requestController = controller
    state.isLoading = true
    try {
      const { employeeWageTiers, totalCount } = await employeeWageTiersApi.list(
        unref(queryOptions),
        { signal: controller.signal }
      )
      if (controller.signal.aborted) {
        return state.employeeWageTiers
      }

      state.isErrored = false
      state.employeeWageTiers = employeeWageTiers
      state.totalCount = totalCount
      return employeeWageTiers
    } catch (error) {
      if (controller.signal.aborted || isCancel(error)) {
        return state.employeeWageTiers
      }

      console.error(`Failed to fetch employee wage tiers: ${error}`, { error })
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
      state.employeeWageTiers = []
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
    { deep: true, immediate: true, flush: "sync" }
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

export default useEmployeeWageTiers
