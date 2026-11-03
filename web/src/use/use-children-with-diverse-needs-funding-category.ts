import { isCancel } from "axios"
import { type Ref, onScopeDispose, reactive, toRefs, unref, watch } from "vue"
import { isNil } from "lodash"

import childrenWithChildrenWithDiverseNeedsFundingRecordsCategoriesApi from "@/api/children-with-diverse-needs-funding-categories-api"
import type {
  ChildrenWithDiverseNeedsFundingCategoryAsShow,
  ChildrenWithDiverseNeedsFundingCategoryPolicy,
  ChildrenWithDiverseNeedsFundingCategoryUpdateAttributes,
} from "@/api/children-with-diverse-needs-funding-categories-api"

export function useChildrenWithDiverseNeedsFundingCategory(
  childrenWithChildrenWithDiverseNeedsFundingRecordsCategoryId: Ref<number | null | undefined>
) {
  const state = reactive<{
    childrenWithChildrenWithDiverseNeedsFundingRecordsCategory: ChildrenWithDiverseNeedsFundingCategoryAsShow | null
    policy: ChildrenWithDiverseNeedsFundingCategoryPolicy | null
    isLoading: boolean
    isErrored: boolean
  }>({
    childrenWithChildrenWithDiverseNeedsFundingRecordsCategory: null,
    policy: null,
    isLoading: false,
    isErrored: false,
  })
  let requestController: AbortController | undefined

  function clearRecord() {
    requestController?.abort()
    requestController = undefined
    state.childrenWithChildrenWithDiverseNeedsFundingRecordsCategory = null
    state.policy = null
    state.isErrored = false
    state.isLoading = false
  }

  async function fetch(): Promise<ChildrenWithDiverseNeedsFundingCategoryAsShow | null> {
    const id = unref(childrenWithChildrenWithDiverseNeedsFundingRecordsCategoryId)
    if (isNil(id)) throw new Error("childrenWithChildrenWithDiverseNeedsFundingRecordsCategoryId is required")

    requestController?.abort()
    const controller = new AbortController()
    requestController = controller
    state.isLoading = true
    try {
      const response = await childrenWithChildrenWithDiverseNeedsFundingRecordsCategoriesApi.get(id, {
        signal: controller.signal,
      })
      if (controller.signal.aborted || unref(childrenWithChildrenWithDiverseNeedsFundingRecordsCategoryId) !== id) {
        return state.childrenWithChildrenWithDiverseNeedsFundingRecordsCategory
      }

      state.childrenWithChildrenWithDiverseNeedsFundingRecordsCategory = response.childrenWithChildrenWithDiverseNeedsFundingRecordsCategory
      state.policy = response.policy
      state.isErrored = false
      return response.childrenWithChildrenWithDiverseNeedsFundingRecordsCategory
    } catch (error) {
      if (controller.signal.aborted || isCancel(error))
        return state.childrenWithChildrenWithDiverseNeedsFundingRecordsCategory

      state.isErrored = true
      throw error
    } finally {
      if (!controller.signal.aborted) state.isLoading = false
    }
  }

  async function save(attributes: ChildrenWithDiverseNeedsFundingCategoryUpdateAttributes = {}) {
    const id = unref(childrenWithChildrenWithDiverseNeedsFundingRecordsCategoryId)
    if (isNil(id)) throw new Error("childrenWithChildrenWithDiverseNeedsFundingRecordsCategoryId is required")
    if (state.childrenWithChildrenWithDiverseNeedsFundingRecordsCategory?.id !== id) {
      throw new Error("The requested Children with Diverse Needs category is not loaded")
    }

    requestController?.abort()
    const controller = new AbortController()
    requestController = controller
    const response = await childrenWithChildrenWithDiverseNeedsFundingRecordsCategoriesApi.update(id, {
      ...state.childrenWithChildrenWithDiverseNeedsFundingRecordsCategory,
      ...attributes,
    })
    if (!controller.signal.aborted && unref(childrenWithChildrenWithDiverseNeedsFundingRecordsCategoryId) === id) {
      state.childrenWithChildrenWithDiverseNeedsFundingRecordsCategory = response.childrenWithChildrenWithDiverseNeedsFundingRecordsCategory
      state.policy = response.policy
    }
    return response.childrenWithChildrenWithDiverseNeedsFundingRecordsCategory
  }

  watch(
    () => unref(childrenWithChildrenWithDiverseNeedsFundingRecordsCategoryId),
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

export default useChildrenWithDiverseNeedsFundingCategory
