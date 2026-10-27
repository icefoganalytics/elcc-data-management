import { isCancel } from "axios"
import { onScopeDispose, reactive, ref, toRefs, unref, watch } from "vue"
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
  let requestController: AbortController | undefined

  async function fetch(): Promise<AdministrationCostCategoryAsIndex[]> {
    requestController?.abort()
    const controller = new AbortController()
    requestController = controller
    state.isLoading = true
    try {
      const response = await administrationCostCategoriesApi.list(unref(queryOptions), {
        signal: controller.signal,
      })
      if (controller.signal.aborted) return state.administrationCostCategories

      state.administrationCostCategories = response.administrationCostCategories
      state.totalCount = response.totalCount
      state.isErrored = false
      return response.administrationCostCategories
    } catch (error) {
      if (controller.signal.aborted || isCancel(error)) return state.administrationCostCategories

      console.error(`Failed to fetch Administration categories: ${error}`, {
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
      state.administrationCostCategories = []
      state.totalCount = 0
      state.isErrored = false
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

export default useAdministrationCostCategories
