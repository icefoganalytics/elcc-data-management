import { isCancel } from "axios"
import { type Ref, onScopeDispose, reactive, toRefs, unref, watch } from "vue"
import { isNil } from "lodash"

import diverseNeedCategoriesApi from "@/api/diverse-need-categories-api"
import type {
  DiverseNeedCategoryAsShow,
  DiverseNeedCategoryPolicy,
  DiverseNeedCategoryUpdateAttributes,
} from "@/api/diverse-need-categories-api"

export function useDiverseNeedCategory(diverseNeedCategoryId: Ref<number | null | undefined>) {
  const state = reactive<{
    diverseNeedCategory: DiverseNeedCategoryAsShow | null
    policy: DiverseNeedCategoryPolicy | null
    isLoading: boolean
    isErrored: boolean
  }>({
    diverseNeedCategory: null,
    policy: null,
    isLoading: false,
    isErrored: false,
  })
  let requestController: AbortController | undefined

  function clearRecord() {
    requestController?.abort()
    requestController = undefined
    state.diverseNeedCategory = null
    state.policy = null
    state.isErrored = false
    state.isLoading = false
  }

  async function fetch(): Promise<DiverseNeedCategoryAsShow | null> {
    const id = unref(diverseNeedCategoryId)
    if (isNil(id)) throw new Error("diverseNeedCategoryId is required")

    requestController?.abort()
    const controller = new AbortController()
    requestController = controller
    state.isLoading = true
    try {
      const response = await diverseNeedCategoriesApi.get(id, { signal: controller.signal })
      if (controller.signal.aborted || unref(diverseNeedCategoryId) !== id) {
        return state.diverseNeedCategory
      }

      state.diverseNeedCategory = response.diverseNeedCategory
      state.policy = response.policy
      state.isErrored = false
      return response.diverseNeedCategory
    } catch (error) {
      if (controller.signal.aborted || isCancel(error)) return state.diverseNeedCategory

      state.isErrored = true
      throw error
    } finally {
      if (!controller.signal.aborted) state.isLoading = false
    }
  }

  async function save(attributes: DiverseNeedCategoryUpdateAttributes = {}) {
    const id = unref(diverseNeedCategoryId)
    if (isNil(id)) throw new Error("diverseNeedCategoryId is required")
    if (state.diverseNeedCategory?.id !== id) {
      throw new Error("The requested diverse need category is not loaded")
    }

    requestController?.abort()
    const controller = new AbortController()
    requestController = controller
    const response = await diverseNeedCategoriesApi.update(id, {
      ...state.diverseNeedCategory,
      ...attributes,
    })
    if (!controller.signal.aborted && unref(diverseNeedCategoryId) === id) {
      state.diverseNeedCategory = response.diverseNeedCategory
      state.policy = response.policy
    }
    return response.diverseNeedCategory
  }

  watch(
    () => unref(diverseNeedCategoryId),
    async (id) => {
      clearRecord()
      if (isNil(id)) return
      await fetch()
    },
    { immediate: true }
  )

  onScopeDispose(() => requestController?.abort())

  return { ...toRefs(state), fetch, save }
}

export default useDiverseNeedCategory
