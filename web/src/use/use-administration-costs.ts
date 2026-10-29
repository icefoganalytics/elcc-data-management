import { isCancel } from "axios"
import { onScopeDispose, reactive, toRefs, unref, watch } from "vue"
import type { Ref } from "vue"

import administrationCostsApi from "@/api/administration-costs-api"
import type {
  AdministrationCostAsIndex,
  AdministrationCostQueryOptions,
} from "@/api/administration-costs-api"

export function useAdministrationCosts(queryOptions: Ref<AdministrationCostQueryOptions>) {
  const state = reactive<{
    administrationCosts: AdministrationCostAsIndex[]
    totalCount: number
    isLoading: boolean
    isErrored: boolean
  }>({
    administrationCosts: [],
    totalCount: 0,
    isLoading: false,
    isErrored: false,
  })
  let requestController: AbortController | undefined

  async function fetch(): Promise<AdministrationCostAsIndex[]> {
    requestController?.abort()
    const controller = new AbortController()
    requestController = controller
    state.isLoading = true
    try {
      const response = await administrationCostsApi.list(unref(queryOptions), {
        signal: controller.signal,
      })
      if (controller.signal.aborted) return state.administrationCosts

      state.administrationCosts = response.administrationCosts
      state.totalCount = response.totalCount
      state.isErrored = false
      return response.administrationCosts
    } catch (error) {
      if (controller.signal.aborted || isCancel(error)) return state.administrationCosts

      console.error(`Failed to fetch Administration costs: ${error}`, {
        error,
      })
      state.isErrored = true
      throw error
    } finally {
      if (!controller.signal.aborted) {
        state.isLoading = false
      }
    }
  }

  watch(
    queryOptions,
    async () => {
      await fetch()
    },
    {
      deep: true,
      immediate: true,
    }
  )

  onScopeDispose(() => {
    requestController?.abort()
  })

  return {
    ...toRefs(state),
    fetch,
  }
}

export default useAdministrationCosts
