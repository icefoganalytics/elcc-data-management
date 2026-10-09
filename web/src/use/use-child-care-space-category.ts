import { type Ref, reactive, toRefs, unref, watch } from "vue"
import { isNil } from "lodash"

import childCareSpaceCategoriesApi, {
  type ChildCareSpaceCategoryAsShow,
  type ChildCareSpaceCategoryPolicy,
} from "@/api/child-care-space-categories-api"

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

  async function fetch(): Promise<ChildCareSpaceCategoryAsShow> {
    const staticChildCareSpaceCategoryId = unref(childCareSpaceCategoryId)
    if (isNil(staticChildCareSpaceCategoryId)) {
      throw new Error("childCareSpaceCategoryId is required")
    }

    state.isLoading = true
    try {
      const { childCareSpaceCategory, policy } = await childCareSpaceCategoriesApi.get(
        staticChildCareSpaceCategoryId
      )
      state.isErrored = false
      state.childCareSpaceCategory = childCareSpaceCategory
      state.policy = policy
      return childCareSpaceCategory
    } catch (error) {
      console.error(`Failed to fetch Child Care Space category: ${error}`, { error })
      state.isErrored = true
      throw error
    } finally {
      state.isLoading = false
    }
  }

  async function save(): Promise<ChildCareSpaceCategoryAsShow> {
    const staticChildCareSpaceCategoryId = unref(childCareSpaceCategoryId)
    if (isNil(staticChildCareSpaceCategoryId)) {
      throw new Error("childCareSpaceCategoryId is required")
    }

    if (isNil(state.childCareSpaceCategory)) {
      throw new Error("childCareSpaceCategory is required")
    }

    state.isLoading = true
    try {
      const { categoryName, fromAge, toAge, monthlyAmount } = state.childCareSpaceCategory
      const { childCareSpaceCategory, policy } = await childCareSpaceCategoriesApi.update(
        staticChildCareSpaceCategoryId,
        { categoryName, fromAge, toAge, monthlyAmount: String(monthlyAmount) }
      )
      state.isErrored = false
      state.childCareSpaceCategory = childCareSpaceCategory
      state.policy = policy
      return childCareSpaceCategory
    } catch (error) {
      console.error(`Failed to save Child Care Space category: ${error}`, { error })
      state.isErrored = true
      throw error
    } finally {
      state.isLoading = false
    }
  }

  watch(
    () => unref(childCareSpaceCategoryId),
    async (newChildCareSpaceCategoryId) => {
      if (isNil(newChildCareSpaceCategoryId)) return

      await fetch()
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
