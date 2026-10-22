import { reactive, toRefs, unref, watch, type Ref } from "vue"
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
  let latestRequest = {}

  function clearRecord() {
    latestRequest = {}
    state.employeeBenefit = null
    state.policy = null
    state.isLoading = false
    state.isErrored = false
  }

  async function fetch(): Promise<EmployeeBenefitAsShow> {
    const employeeBenefitId = unref(id)
    if (isNil(employeeBenefitId)) throw new Error("id is required")

    const request = {}
    latestRequest = request
    state.employeeBenefit = null
    state.policy = null
    state.isErrored = false
    state.isLoading = true
    try {
      const { employeeBenefit, policy } = await employeeBenefitsApi.get(employeeBenefitId)
      if (latestRequest === request) {
        state.employeeBenefit = employeeBenefit
        state.policy = policy
      }
      return employeeBenefit
    } catch (error) {
      console.error(`Failed to fetch employee benefit: ${error}`, { error })
      if (latestRequest === request) state.isErrored = true
      throw error
    } finally {
      if (latestRequest === request) state.isLoading = false
    }
  }

  async function save(
    attributesOverrides: Partial<EmployeeBenefitAsShow> = {}
  ): Promise<EmployeeBenefitAsShow> {
    const employeeBenefitId = unref(id)
    if (isNil(employeeBenefitId)) throw new Error("id is required")
    if (isNil(state.employeeBenefit)) throw new Error("No employee benefit to save")

    const request = latestRequest
    state.isLoading = true
    try {
      const { employeeBenefit, policy } = await employeeBenefitsApi.update(employeeBenefitId, {
        ...state.employeeBenefit,
        ...attributesOverrides,
      })
      if (latestRequest === request) {
        state.employeeBenefit = employeeBenefit
        state.policy = policy
        state.isErrored = false
      }
      return employeeBenefit
    } catch (error) {
      console.error(`Failed to save employee benefit: ${error}`, { error })
      if (latestRequest === request) state.isErrored = true
      throw error
    } finally {
      if (latestRequest === request) state.isLoading = false
    }
  }

  watch(
    () => unref(id),
    async (employeeBenefitId) => {
      if (isNil(employeeBenefitId)) {
        clearRecord()
        return
      }
      try {
        await fetch()
      } catch {
        // Explicit refresh callers receive the rejection; the UI reads isErrored.
      }
    },
    { immediate: true, flush: "sync" }
  )

  return { ...toRefs(state), fetch, refresh: fetch, save }
}

export default useEmployeeBenefit
