import { isCancel } from "axios"
import { isNil } from "lodash"
import { onScopeDispose, reactive, toRefs, unref, watch, type Ref } from "vue"
import qualityEnhancementCategoriesApi, {
  type QualityEnhancementCategoryAsShow,
  type QualityEnhancementCategoryPolicy,
} from "@/api/quality-enhancement-categories-api"

export { type QualityEnhancementCategoryAsShow }

export function useQualityEnhancementCategory(
  qualityEnhancementCategoryId: Ref<number | null | undefined>
) {
  const state = reactive<{
    qualityEnhancementCategory: QualityEnhancementCategoryAsShow | null
    policy: QualityEnhancementCategoryPolicy | null
    isLoading: boolean
    isErrored: boolean
  }>({
    qualityEnhancementCategory: null,
    policy: null,
    isLoading: false,
    isErrored: false,
  })
  let latestRequest = {}
  let requestController: AbortController | undefined

  async function fetch(): Promise<QualityEnhancementCategoryAsShow | null> {
    const staticQualityEnhancementCategoryId = unref(qualityEnhancementCategoryId)
    if (isNil(staticQualityEnhancementCategoryId)) {
      throw new Error("qualityEnhancementCategoryId is required")
    }

    requestController?.abort()
    const controller = new AbortController()
    requestController = controller
    const request = {}
    latestRequest = request
    state.isLoading = true
    state.isErrored = false
    try {
      const { qualityEnhancementCategory, policy } = await qualityEnhancementCategoriesApi.get(
        staticQualityEnhancementCategoryId,
        { signal: controller.signal }
      )
      if (
        controller.signal.aborted ||
        latestRequest !== request ||
        unref(qualityEnhancementCategoryId) !== staticQualityEnhancementCategoryId
      ) {
        return qualityEnhancementCategory
      }

      state.qualityEnhancementCategory = qualityEnhancementCategory
      state.policy = policy
      return qualityEnhancementCategory
    } catch (error) {
      if (controller.signal.aborted || isCancel(error)) {
        return state.qualityEnhancementCategory
      }

      console.error(`Failed to fetch Quality Enhancement category: ${error}`, { error })
      if (latestRequest === request) {
        state.isErrored = true
      }
      throw error
    } finally {
      if (!controller.signal.aborted && latestRequest === request) {
        state.isLoading = false
      }
    }
  }

  async function save(): Promise<QualityEnhancementCategoryAsShow> {
    const staticQualityEnhancementCategoryId = unref(qualityEnhancementCategoryId)
    if (isNil(staticQualityEnhancementCategoryId)) {
      throw new Error("qualityEnhancementCategoryId is required")
    }

    if (state.qualityEnhancementCategory?.id !== staticQualityEnhancementCategoryId) {
      throw new Error("The requested Quality Enhancement category is not loaded")
    }

    const request = {}
    latestRequest = request
    state.isLoading = true
    try {
      const { categoryName, fromAge, toAge, monthlyAmount, childCareSpaceCategoryId } =
        state.qualityEnhancementCategory
      const attributes = {
        categoryName,
        fromAge,
        toAge,
        monthlyAmount: String(monthlyAmount),
        childCareSpaceCategoryId,
      }
      const { qualityEnhancementCategory, policy } = await qualityEnhancementCategoriesApi.update(
        staticQualityEnhancementCategoryId,
        attributes
      )
      if (
        latestRequest === request &&
        unref(qualityEnhancementCategoryId) === staticQualityEnhancementCategoryId
      ) {
        state.isErrored = false
        state.qualityEnhancementCategory = qualityEnhancementCategory
        state.policy = policy
      }
      return qualityEnhancementCategory
    } catch (error) {
      console.error(`Failed to save Quality Enhancement category: ${error}`, { error })
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
    () => unref(qualityEnhancementCategoryId),
    async (newQualityEnhancementCategoryId) => {
      requestController?.abort()
      requestController = undefined
      latestRequest = {}
      state.qualityEnhancementCategory = null
      state.policy = null
      state.isErrored = false
      state.isLoading = false
      if (isNil(newQualityEnhancementCategoryId)) {
        return
      }

      try {
        await fetch()
      } catch {
        // fetch() preserves rejection for explicit callers; watcher failures use isErrored.
      }
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

export default useQualityEnhancementCategory
