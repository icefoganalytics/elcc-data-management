import { isCancel } from "axios"
import { onScopeDispose, reactive, toRefs, unref, watch, type Ref } from "vue"
import { isNil } from "lodash"

import employeeBenefitsApi, {
  type EmployeeBenefitAsShow,
  type EmployeeBenefitPolicy,
} from "@/api/employee-benefits-api"

export { type EmployeeBenefitAsShow }

export function useEmployeeBenefit(id: Ref<number | null | undefined>) {
  const state = reactive<{
    employeeBenefit: EmployeeBenefitAsShow | null
    policy: EmployeeBenefitPolicy | null
    isLoading: boolean
    isErrored: boolean
  }>({ employeeBenefit: null, policy: null, isLoading: false, isErrored: false })
  let requestController: AbortController | undefined

  function clearRecord() {
    requestController?.abort()
    requestController = undefined
    state.employeeBenefit = null
    state.policy = null
    state.isLoading = false
    state.isErrored = false
  }

  async function fetch(): Promise<EmployeeBenefitAsShow | null> {
    const employeeBenefitId = unref(id)
    if (isNil(employeeBenefitId)) throw new Error("id is required")

    requestController?.abort()
    const controller = new AbortController()
    requestController = controller
    state.employeeBenefit = null
    state.policy = null
    state.isErrored = false
    state.isLoading = true
    try {
      const { employeeBenefit, policy } = await employeeBenefitsApi.get(employeeBenefitId, {
        signal: controller.signal,
      })
      if (controller.signal.aborted) return state.employeeBenefit

      state.employeeBenefit = employeeBenefit
      state.policy = policy
      return employeeBenefit
    } catch (error) {
      if (controller.signal.aborted) return state.employeeBenefit

      if (isCancel(error)) {
        state.isErrored = false
        return state.employeeBenefit
      }

      console.error(`Failed to fetch employee benefit: ${error}`, { error })
      state.isErrored = true
      throw error
    } finally {
      if (!controller.signal.aborted) {
        state.isLoading = false
      }
    }
  }

  async function save(
    attributesOverrides: Partial<EmployeeBenefitAsShow> = {}
  ): Promise<EmployeeBenefitAsShow> {
    const employeeBenefitId = unref(id)
    if (isNil(employeeBenefitId)) throw new Error("id is required")

    const selectedRecord = state.employeeBenefit
    if (isNil(selectedRecord)) throw new Error("No employee benefit to save")

    const signal = requestController?.signal
    state.isLoading = true
    try {
      const { employeeBenefit, policy } = await employeeBenefitsApi.update(employeeBenefitId, {
        ...selectedRecord,
        ...attributesOverrides,
      })
      if (!signal?.aborted) {
        state.employeeBenefit = employeeBenefit
        state.policy = policy
        state.isErrored = false
      }
      return employeeBenefit
    } catch (error) {
      console.error(`Failed to save employee benefit: ${error}`, { error })
      if (!signal?.aborted) {
        state.isErrored = true
      }
      throw error
    } finally {
      if (!signal?.aborted) {
        state.isLoading = false
      }
    }
  }

  watch(
    () => unref(id),
    async (employeeBenefitId) => {
      clearRecord()
      if (isNil(employeeBenefitId)) return

      try {
        await fetch()
      } catch {
        // Explicit refresh callers receive the rejection; the UI reads isErrored.
      }
    },
    { immediate: true }
  )

  onScopeDispose(() => {
    requestController?.abort()
  })

  return { ...toRefs(state), fetch, refresh: fetch, save }
}

export default useEmployeeBenefit
