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

import useSnack from "@/use/use-snack"

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

  const snack = useSnack()

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
    const staticChildrenWithDiverseNeedsFundingCategoryId = unref(
      childrenWithDiverseNeedsFundingCategoryId
    )
    if (isNil(staticChildrenWithDiverseNeedsFundingCategoryId)) {
      throw new Error("childrenWithDiverseNeedsFundingCategoryId is required")
    }

    requestController?.abort()

    const controller = new AbortController()
    requestController = controller
    state.isLoading = true
    state.isErrored = false

    try {
      const { childrenWithDiverseNeedsFundingCategory, policy } =
        await childrenWithDiverseNeedsFundingCategoriesApi.get(
          staticChildrenWithDiverseNeedsFundingCategoryId,
          {
            signal: controller.signal,
          }
        )
      if (
        controller.signal.aborted ||
        unref(childrenWithDiverseNeedsFundingCategoryId) !==
          staticChildrenWithDiverseNeedsFundingCategoryId
      ) {
        return state.childrenWithDiverseNeedsFundingCategory
      }

      state.childrenWithDiverseNeedsFundingCategory = childrenWithDiverseNeedsFundingCategory
      state.policy = policy
      state.isErrored = false

      return childrenWithDiverseNeedsFundingCategory
    } catch (error) {
      if (controller.signal.aborted || isCancel(error)) {
        return state.childrenWithDiverseNeedsFundingCategory
      }

      console.error("Failed to fetch Children with Diverse Needs funding category", {
        error,
      })
      if (
        unref(childrenWithDiverseNeedsFundingCategoryId) ===
        staticChildrenWithDiverseNeedsFundingCategoryId
      ) {
        state.isErrored = true
      }

      rethrowUnexpectedError(error)

      snack.error(`Failed to load Children with Diverse Needs funding category: ${error}`)
      return state.childrenWithDiverseNeedsFundingCategory
    } finally {
      if (
        !controller.signal.aborted &&
        unref(childrenWithDiverseNeedsFundingCategoryId) ===
          staticChildrenWithDiverseNeedsFundingCategoryId
      ) {
        state.isLoading = false
      }
    }
  }

  async function save(
    attributes: ChildrenWithDiverseNeedsFundingCategoryUpdateAttributes = {}
  ): Promise<ChildrenWithDiverseNeedsFundingCategoryAsShow> {
    const staticChildrenWithDiverseNeedsFundingCategoryId = unref(
      childrenWithDiverseNeedsFundingCategoryId
    )
    if (isNil(staticChildrenWithDiverseNeedsFundingCategoryId)) {
      throw new Error("childrenWithDiverseNeedsFundingCategoryId is required")
    }

    if (
      state.childrenWithDiverseNeedsFundingCategory?.id !==
      staticChildrenWithDiverseNeedsFundingCategoryId
    ) {
      throw new Error("The requested Children with Diverse Needs funding category is not loaded")
    }

    const signal = requestController?.signal

    try {
      const { categoryName, fromAge, toAge, monthlyAmount } =
        state.childrenWithDiverseNeedsFundingCategory
      const { childrenWithDiverseNeedsFundingCategory, policy } =
        await childrenWithDiverseNeedsFundingCategoriesApi.update(
          staticChildrenWithDiverseNeedsFundingCategoryId,
          {
            categoryName,
            fromAge,
            toAge,
            monthlyAmount,
            ...attributes,
          }
        )
      if (!signal?.aborted) {
        state.childrenWithDiverseNeedsFundingCategory = childrenWithDiverseNeedsFundingCategory
        state.policy = policy
      }

      return childrenWithDiverseNeedsFundingCategory
    } catch (error) {
      console.error("Failed to save Children with Diverse Needs funding category", {
        error,
      })
      throw error
    }
  }

  watch(
    () => unref(childrenWithDiverseNeedsFundingCategoryId),
    async (newChildrenWithDiverseNeedsFundingCategoryId) => {
      clearRecord()
      if (isNil(newChildrenWithDiverseNeedsFundingCategoryId)) return

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
    refresh: fetch,
    save,
  }
}

export default useChildrenWithDiverseNeedsFundingCategory
