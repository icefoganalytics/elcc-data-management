import { type Ref, reactive, toRefs, unref, watch } from "vue"
import { isNil } from "lodash"

import administrationCostCategoriesApi, {
  type AdministrationCostCategoryAsShow,
  type AdministrationCostCategoryPolicy,
  type AdministrationCostCategoryUpdateAttributes,
} from "@/api/administration-cost-categories-api"

export function useAdministrationCostCategory(
  administrationCostCategoryId: Ref<number | null | undefined>
) {
  const state = reactive<{
    administrationCostCategory: AdministrationCostCategoryAsShow | null
    policy: AdministrationCostCategoryPolicy | null
    isLoading: boolean
    isErrored: boolean
  }>({
    administrationCostCategory: null,
    policy: null,
    isLoading: false,
    isErrored: false,
  })
  let latestRequest = {}

  async function fetch() {
    const id = unref(administrationCostCategoryId)
    if (isNil(id)) throw new Error("administrationCostCategoryId is required")

    const request = {}
    latestRequest = request
    state.isLoading = true
    try {
      const response = await administrationCostCategoriesApi.get(id)
      if (latestRequest === request && unref(administrationCostCategoryId) === id) {
        state.administrationCostCategory = response.administrationCostCategory
        state.policy = response.policy
        state.isErrored = false
      }
      return response.administrationCostCategory
    } catch (error) {
      if (latestRequest === request) state.isErrored = true

      throw error
    } finally {
      if (latestRequest === request) state.isLoading = false
    }
  }

  async function save(attributes: AdministrationCostCategoryUpdateAttributes) {
    const id = unref(administrationCostCategoryId)
    if (isNil(id)) throw new Error("administrationCostCategoryId is required")
    if (state.administrationCostCategory?.id !== id) {
      throw new Error("The requested Administration cost category is not loaded")
    }

    const request = {}
    latestRequest = request
    const response = await administrationCostCategoriesApi.update(id, attributes)
    if (latestRequest === request && unref(administrationCostCategoryId) === id) {
      state.administrationCostCategory = response.administrationCostCategory
      state.policy = response.policy
    }
    return response.administrationCostCategory
  }

  async function remove() {
    const id = unref(administrationCostCategoryId)
    if (isNil(id)) throw new Error("administrationCostCategoryId is required")
    if (state.administrationCostCategory?.id !== id) {
      throw new Error("The requested Administration cost category is not loaded")
    }

    await administrationCostCategoriesApi.delete(id)
  }

  watch(
    () => unref(administrationCostCategoryId),
    async (id) => {
      latestRequest = {}
      state.administrationCostCategory = null
      state.policy = null
      state.isErrored = false
      state.isLoading = false
      if (isNil(id)) return

      try {
        await fetch()
      } catch {
        // Fetch state exposes the error to the page.
      }
    },
    {
      immediate: true,
    }
  )

  return {
    ...toRefs(state),
    fetch,
    save,
    remove,
  }
}

export default useAdministrationCostCategory
