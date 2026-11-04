import { isCancel } from "axios"
import { isNil } from "lodash"
import { onScopeDispose, reactive, toRefs, unref, watch } from "vue"
import type { Ref } from "vue"

import childrenWithDiverseNeedsFundingCategoriesApi from "@/api/children-with-diverse-needs-funding-categories-api"
import type {
  ChildrenWithDiverseNeedsFundingCategoryAsShow,
  ChildrenWithDiverseNeedsFundingCategoryPolicy,
  ChildrenWithDiverseNeedsFundingCategoryUpdateAttributes,
} from "@/api/children-with-diverse-needs-funding-categories-api"
import rethrowUnexpectedError from "@/api/errors/rethrow-unexpected-error"

export function useChildrenWithDiverseNeedsFundingCategory(
  childrenWithDiverseNeedsFundingCategoryId: Ref<number | null | undefined>
) {
  const state = reactive<{
    childrenWithDiverseNeedsFundingCategory: ChildrenWithDiverseNeedsFundingCategoryAsShow | null
    policy: ChildrenWithDiverseNeedsFundingCategoryPolicy | null
    isLoading: boolean
    isErrored: boolean
  }>({
    childrenWithDiverseNeedsFundingCategory: null,
    policy: null,
    isLoading: false,
    isErrored: false,
  })

  let requestController: AbortController | undefined

  function clearRecord() {
    requestController?.abort()
    requestController = undefined
    state.childrenWithDiverseNeedsFundingCategory = null
    state.policy = null
    state.isErrored = false
    state.isLoading = false
  }

  async function fetch(): Promise<ChildrenWithDiverseNeedsFundingCategoryAsShow | null> {
    const id = unref(childrenWithDiverseNeedsFundingCategoryId)
    if (isNil(id)) throw new Error("childrenWithDiverseNeedsFundingCategoryId is required")

    requestController?.abort()

    const controller = new AbortController()
    requestController = controller
    state.isLoading = true
    state.isErrored = false

    try {
      const response = await childrenWithDiverseNeedsFundingCategoriesApi.get(id, {
        signal: controller.signal,
      })
      if (controller.signal.aborted || unref(childrenWithDiverseNeedsFundingCategoryId) !== id) {
        return state.childrenWithDiverseNeedsFundingCategory
      }

      state.childrenWithDiverseNeedsFundingCategory =
        response.childrenWithDiverseNeedsFundingCategory
      state.policy = response.policy
      state.isErrored = false
      return response.childrenWithDiverseNeedsFundingCategory
    } catch (error) {
      if (controller.signal.aborted || isCancel(error))
        return state.childrenWithDiverseNeedsFundingCategory

      console.error("Failed to fetch Children with Diverse Needs funding category", { error })
      if (unref(childrenWithDiverseNeedsFundingCategoryId) === id) {
        state.isErrored = true
      }
      throw error
    } finally {
      if (!controller.signal.aborted && unref(childrenWithDiverseNeedsFundingCategoryId) === id) {
        state.isLoading = false
      }
    }
  }

  async function save(
    attributes: ChildrenWithDiverseNeedsFundingCategoryUpdateAttributes = {}
  ): Promise<ChildrenWithDiverseNeedsFundingCategoryAsShow> {
    const id = unref(childrenWithDiverseNeedsFundingCategoryId)
    if (isNil(id)) throw new Error("childrenWithDiverseNeedsFundingCategoryId is required")

    if (state.childrenWithDiverseNeedsFundingCategory?.id !== id) {
      throw new Error("The requested Children with Diverse Needs funding category is not loaded")
    }

    requestController?.abort()

    const controller = new AbortController()
    requestController = controller
    state.isLoading = true
    state.isErrored = false

    try {
      const { categoryName, fromAge, toAge, monthlyAmount } =
        state.childrenWithDiverseNeedsFundingCategory
      const response = await childrenWithDiverseNeedsFundingCategoriesApi.update(id, {
        categoryName,
        fromAge,
        toAge,
        monthlyAmount,
        ...attributes,
      })
      if (!controller.signal.aborted && unref(childrenWithDiverseNeedsFundingCategoryId) === id) {
        state.childrenWithDiverseNeedsFundingCategory =
          response.childrenWithDiverseNeedsFundingCategory
        state.policy = response.policy
      }
      return response.childrenWithDiverseNeedsFundingCategory
    } catch (error) {
      console.error("Failed to save Children with Diverse Needs funding category", { error })
      if (!controller.signal.aborted && unref(childrenWithDiverseNeedsFundingCategoryId) === id) {
        state.isErrored = true
      }
      throw error
    } finally {
      if (!controller.signal.aborted && unref(childrenWithDiverseNeedsFundingCategoryId) === id) {
        state.isLoading = false
      }
    }
  }

  watch(
    () => unref(childrenWithDiverseNeedsFundingCategoryId),
    async (id) => {
      clearRecord()
      if (isNil(id)) return

      try {
        await fetch()
      } catch (error) {
        rethrowUnexpectedError(error)
      }
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
    refresh: fetch,
    save,
  }
}

export default useChildrenWithDiverseNeedsFundingCategory
