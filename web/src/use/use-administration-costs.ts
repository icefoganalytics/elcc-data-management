import { reactive, toRefs, unref, watch } from "vue"
import type { Ref } from "vue"
import administrationCostsApi from "@/api/administration-costs-api"
import type {
  AdministrationCostAsIndex,
  AdministrationCostQueryOptions,
} from "@/api/administration-costs-api"

export function useAdministrationCosts(queryOptions: Ref<AdministrationCostQueryOptions>) {
  const state = reactive({
    administrationCosts: [] as AdministrationCostAsIndex[],
    totalCount: 0,
    isLoading: false,
    isErrored: false,
  })
  let latestRequest = {}
  async function fetch() {
    const request = {}
    latestRequest = request
    state.isLoading = true
    try {
      const response = await administrationCostsApi.list(unref(queryOptions))
      if (latestRequest === request) {
        state.administrationCosts = response.administrationCosts
        state.totalCount = response.totalCount
        state.isErrored = false
      }
      return response.administrationCosts
    } catch (error) {
      console.error(`Failed to fetch Administration costs: ${error}`, {
        error,
      })
      if (latestRequest === request) state.isErrored = true
      throw error
    } finally {
      if (latestRequest === request) state.isLoading = false
    }
  }
  watch(
    queryOptions,
    async () => {
      try {
        await fetch()
      } catch {
        // Fetch state exposes the error to the worksheet.
      }
    },
    {
      deep: true,
      immediate: true,
    }
  )
  return {
    ...toRefs(state),
    fetch,
  }
}

export default useAdministrationCosts
