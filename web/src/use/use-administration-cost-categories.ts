import { reactive, ref, toRefs, unref, watch } from "vue"
import type { Ref } from "vue"
import administrationCostCategoriesApi from "@/api/administration-cost-categories-api"
import type {
  AdministrationCostCategoryAsIndex,
  AdministrationCostCategoryQueryOptions,
} from "@/api/administration-cost-categories-api"

export function useAdministrationCostCategories(
  queryOptions: Ref<AdministrationCostCategoryQueryOptions> = ref({})
) {
  const state = reactive({
    administrationCostCategories: [] as AdministrationCostCategoryAsIndex[],
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
      const response = await administrationCostCategoriesApi.list(unref(queryOptions))
      if (latestRequest === request) {
        state.administrationCostCategories = response.administrationCostCategories
        state.totalCount = response.totalCount
        state.isErrored = false
      }
      return response.administrationCostCategories
    } catch (error) {
      console.error(`Failed to fetch Administration categories: ${error}`, {
        error,
      })
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
    queryOptions,
    async () => {
      try {
        await fetch()
      } catch {
        // Fetch state exposes the error to the page.
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

export default useAdministrationCostCategories
