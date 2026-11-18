import { isCancel } from "axios"
import { isNil } from "lodash"
import { onScopeDispose, reactive, toRefs, unref, watch, type Ref } from "vue"

import childCareCategoriesApi, {
  type ChildCareCategoryAsShow,
  type ChildCareCategoryPolicy,
} from "@/api/child-care-categories-api"
import rethrowUnexpectedError from "@/api/errors/rethrow-unexpected-error"

export { type ChildCareCategoryAsShow }

export function useChildCareCategory(childCareCategoryId: Ref<number | null | undefined>) {
  const state = reactive<{
    childCareCategory: ChildCareCategoryAsShow | null
    policy: ChildCareCategoryPolicy | null
    isLoading: boolean
    isErrored: boolean
  }>({
    childCareCategory: null,
    policy: null,
    isLoading: false,
    isErrored: false,
  })
  let latestRequest = {}
  let requestController: AbortController | undefined

  async function fetch(): Promise<ChildCareCategoryAsShow | null> {
    const staticChildCareCategoryId = unref(childCareCategoryId)
    if (isNil(staticChildCareCategoryId)) {
      throw new Error("childCareCategoryId is required")
    }

    requestController?.abort()
    const controller = new AbortController()
    requestController = controller
    const request = {}
    latestRequest = request
    state.isLoading = true
    state.isErrored = false
    try {
      const { childCareCategory, policy } = await childCareCategoriesApi.get(
        staticChildCareCategoryId,
        { signal: controller.signal }
      )
      if (
        controller.signal.aborted ||
        latestRequest !== request ||
        unref(childCareCategoryId) !== staticChildCareCategoryId
      ) {
        return childCareCategory
      }

      state.childCareCategory = childCareCategory
      state.policy = policy
      return childCareCategory
    } catch (error) {
      if (controller.signal.aborted || isCancel(error)) {
        return state.childCareCategory
      }

      if (latestRequest === request) {
        state.isErrored = true
      }
      rethrowUnexpectedError(error)
      console.error(`Failed to fetch Child Care category: ${error}`, { error })
      return state.childCareCategory
    } finally {
      state.isLoading = false
    }
  }

  async function save(): Promise<ChildCareCategoryAsShow> {
    const staticChildCareCategoryId = unref(childCareCategoryId)
    if (isNil(staticChildCareCategoryId)) {
      throw new Error("childCareCategoryId is required")
    }

    if (state.childCareCategory?.id !== staticChildCareCategoryId) {
      throw new Error("The requested Child Care category is not loaded")
    }

    const request = {}
    latestRequest = request
    state.isLoading = true
    try {
      const { categoryName, fromAge, toAge } = state.childCareCategory
      const attributes = { categoryName, fromAge, toAge }
      const { childCareCategory, policy } = await childCareCategoriesApi.update(
        staticChildCareCategoryId,
        attributes
      )
      if (latestRequest === request && unref(childCareCategoryId) === staticChildCareCategoryId) {
        state.isErrored = false
        state.childCareCategory = childCareCategory
        state.policy = policy
      }
      return childCareCategory
    } finally {
      state.isLoading = false
    }
  }

  watch(
    () => unref(childCareCategoryId),
    async (newChildCareCategoryId) => {
      requestController?.abort()
      requestController = undefined
      latestRequest = {}
      state.childCareCategory = null
      state.policy = null
      state.isErrored = false
      state.isLoading = false
      if (isNil(newChildCareCategoryId)) {
        return
      }

      await fetch()
    },
    { immediate: true }
  )

  onScopeDispose(() => {
    requestController?.abort()
  })

  return {
    ...toRefs(state),
    fetch,
    refresh: fetch,
    save,
  }
}

export default useChildCareCategory
