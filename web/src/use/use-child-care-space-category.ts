import { type Ref, reactive, toRefs, unref, watch } from "vue"
import { isNil } from "lodash"

import childCareSpaceCategoriesApi, {
  type ChildCareSpaceCategoryAsShow,
  type ChildCareSpaceCategoryPolicy,
  type ChildCareSpaceCategoryPropagationOptions,
} from "@/api/child-care-space-categories-api"

import { UnexpectedApiResponseError } from "@/api/errors/unexpected-api-response-error"
export { type ChildCareSpaceCategoryAsShow }

export function useChildCareSpaceCategory(
  childCareSpaceCategoryId: Ref<number | null | undefined>
) {
  const state = reactive<{
    childCareSpaceCategory: ChildCareSpaceCategoryAsShow | null
    policy: ChildCareSpaceCategoryPolicy | null
    isLoading: boolean
    isErrored: boolean
  }>({
    childCareSpaceCategory: null,
    policy: null,
    isLoading: false,
    isErrored: false,
  })
  let latestRequest = {}

  async function fetch(): Promise<ChildCareSpaceCategoryAsShow> {
    const staticChildCareSpaceCategoryId = unref(childCareSpaceCategoryId)
    if (isNil(staticChildCareSpaceCategoryId)) {
      throw new Error("childCareSpaceCategoryId is required")
    }

    const request = {}
    latestRequest = request
    state.isLoading = true
    try {
      const { childCareSpaceCategory, policy } = await childCareSpaceCategoriesApi.get(
        staticChildCareSpaceCategoryId
      )
      if (
        latestRequest === request &&
        unref(childCareSpaceCategoryId) === staticChildCareSpaceCategoryId
      ) {
        state.isErrored = false
        state.childCareSpaceCategory = childCareSpaceCategory
        state.policy = policy
      }
      return childCareSpaceCategory
    } catch (error) {
      console.error(`Failed to fetch Child Care Space category: ${error}`, { error })
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

  async function save(
    propagationOptions?: ChildCareSpaceCategoryPropagationOptions
  ): Promise<ChildCareSpaceCategoryAsShow> {
    const staticChildCareSpaceCategoryId = unref(childCareSpaceCategoryId)
    if (isNil(staticChildCareSpaceCategoryId)) {
      throw new Error("childCareSpaceCategoryId is required")
    }

    if (state.childCareSpaceCategory?.id !== staticChildCareSpaceCategoryId) {
      throw new Error("The requested Child Care Space category is not loaded")
    }

    const request = {}
    latestRequest = request
    state.isLoading = true
    try {
      const { categoryName, fromAge, toAge, monthlyAmount } = state.childCareSpaceCategory
      const attributes = {
        categoryName,
        fromAge,
        toAge,
        monthlyAmount: String(monthlyAmount),
        ...propagationOptions,
      }
      const { childCareSpaceCategory, policy } = await childCareSpaceCategoriesApi.update(
        staticChildCareSpaceCategoryId,
        attributes
      )
      if (
        latestRequest === request &&
        unref(childCareSpaceCategoryId) === staticChildCareSpaceCategoryId
      ) {
        state.isErrored = false
        state.childCareSpaceCategory = childCareSpaceCategory
        state.policy = policy
      }
      return childCareSpaceCategory
    } catch (error) {
      console.error(`Failed to save Child Care Space category: ${error}`, { error })
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
    () => unref(childCareSpaceCategoryId),
    async (newChildCareSpaceCategoryId) => {
      latestRequest = {}
      state.childCareSpaceCategory = null
      state.policy = null
      state.isErrored = false
      state.isLoading = false
      if (isNil(newChildCareSpaceCategoryId)) {
        return
      }

      try {
        await fetch()
      } catch (error) {
        if (error instanceof UnexpectedApiResponseError) throw error
        // fetch() records failures; explicit refresh callers still receive the rejection.
      }
    },
    { immediate: true }
  )

  return {
    ...toRefs(state),
    fetch,
    refresh: fetch,
    save,
  }
}

export default useChildCareSpaceCategory
