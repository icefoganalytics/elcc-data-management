import { isCancel } from "axios"
import { type Ref, onScopeDispose, reactive, toRefs, unref, watch } from "vue"
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
  let requestController: AbortController | undefined

  function clearRecord() {
    requestController?.abort()
    requestController = undefined
    state.administrationCostCategory = null
    state.policy = null
    state.isErrored = false
    state.isLoading = false
  }

  async function fetch(): Promise<AdministrationCostCategoryAsShow | null> {
    const id = unref(administrationCostCategoryId)
    if (isNil(id)) throw new Error("administrationCostCategoryId is required")

    requestController?.abort()
    const controller = new AbortController()
    requestController = controller
    state.isLoading = true
    try {
      const response = await administrationCostCategoriesApi.get(id, {
        signal: controller.signal,
      })
      if (controller.signal.aborted || unref(administrationCostCategoryId) !== id) {
        return state.administrationCostCategory
      }

      state.administrationCostCategory = response.administrationCostCategory
      state.policy = response.policy
      state.isErrored = false
      return response.administrationCostCategory
    } catch (error) {
      if (controller.signal.aborted || isCancel(error)) return state.administrationCostCategory

      state.isErrored = true
      throw error
    } finally {
      if (!controller.signal.aborted) {
        state.isLoading = false
      }
    }
  }

  async function save(attributesOverrides: AdministrationCostCategoryUpdateAttributes = {}) {
    const id = unref(administrationCostCategoryId)
    if (isNil(id)) throw new Error("administrationCostCategoryId is required")
    if (state.administrationCostCategory?.id !== id) {
      throw new Error("The requested Administration cost category is not loaded")
    }

    // Numeric inputs emit an empty string when cleared.
    if (String(state.administrationCostCategory.fromAge) === "") {
      state.administrationCostCategory.fromAge = null
    }
    if (String(state.administrationCostCategory.toAge) === "") {
      state.administrationCostCategory.toAge = null
    }

    requestController?.abort()
    const controller = new AbortController()
    requestController = controller
    state.isLoading = false
    const response = await administrationCostCategoriesApi.update(id, {
      ...state.administrationCostCategory,
      ...attributesOverrides,
    })
    if (!controller.signal.aborted && unref(administrationCostCategoryId) === id) {
      state.administrationCostCategory = response.administrationCostCategory
      state.policy = response.policy
    }
    return response.administrationCostCategory
  }

  watch(
    () => unref(administrationCostCategoryId),
    async (id) => {
      clearRecord()
      if (isNil(id)) return

      await fetch()
    },
    {
      immediate: true,
    }
  )

  onScopeDispose(() => {
    requestController?.abort()
  })

  return {
    ...toRefs(state),
    fetch,
    save,
  }
}

export default useAdministrationCostCategory
