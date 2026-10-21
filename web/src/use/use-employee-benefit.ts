import { type Ref, computed, reactive, ref, toRefs, unref, watch } from "vue"
import { isNil, isUndefined, pick } from "lodash"

import employeeBenefitsApi, {
  type EmployeeBenefitAsShow,
  type EmployeeBenefitPolicy,
} from "@/api/employee-benefits-api"

export { type EmployeeBenefitAsShow }

export type EmployeeBenefitEditableAttribute =
  | "grossPayrollMonthlyActual"
  | "grossPayrollMonthlyEstimated"
  | "costCapPercentage"
  | "employeeCostActual"
  | "employeeCostEstimated"
  | "employerCostActual"
  | "employerCostEstimated"

type EmployeeBenefitChanges = Partial<Pick<EmployeeBenefitAsShow, EmployeeBenefitEditableAttribute>>

export function useEmployeeBenefit(id: Ref<number | null | undefined>) {
  const state = reactive<{
    employeeBenefit: EmployeeBenefitAsShow | null
    policy: EmployeeBenefitPolicy | null
    isLoading: boolean
    isErrored: boolean
    isSaving: boolean
  }>({
    employeeBenefit: null,
    policy: null,
    isLoading: false,
    isErrored: false,
    isSaving: false,
  })
  let latestRequest = {}
  let persistedAttributes: EmployeeBenefitChanges = {}
  let pendingChanges: EmployeeBenefitChanges = {}
  // Serialize writes for the same record and attribute, including after navigation.
  const attributeSaves = new Map<string, { request: object; promise: Promise<void> }>()
  let activeSaveCount = 0
  const saveErrors = ref<Partial<Record<EmployeeBenefitEditableAttribute, string>>>({})
  const saveError = computed(() => Object.values(saveErrors.value).find(Boolean) ?? "")

  function clearRecord() {
    latestRequest = {}
    state.employeeBenefit = null
    state.policy = null
    state.isLoading = false
    state.isErrored = false
    state.isSaving = false
    persistedAttributes = {}
    pendingChanges = {}
    activeSaveCount = 0
    saveErrors.value = {}
  }

  async function fetch(): Promise<EmployeeBenefitAsShow> {
    const employeeBenefitId = unref(id)
    if (isNil(employeeBenefitId)) {
      throw new Error("id is required")
    }

    clearRecord()
    const request = latestRequest
    state.isLoading = true
    try {
      const { employeeBenefit, policy } = await employeeBenefitsApi.get(employeeBenefitId)
      if (latestRequest === request) {
        state.employeeBenefit = employeeBenefit
        state.policy = policy
        persistedAttributes = pick(employeeBenefit, [
          "grossPayrollMonthlyActual",
          "grossPayrollMonthlyEstimated",
          "costCapPercentage",
          "employeeCostActual",
          "employeeCostEstimated",
          "employerCostActual",
          "employerCostEstimated",
        ])
      }
      return employeeBenefit
    } catch (error) {
      console.error(`Failed to fetch employee benefit: ${error}`, { error })
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

  function updateAttribute(attribute: EmployeeBenefitEditableAttribute, value: string) {
    if (isNil(state.employeeBenefit)) return

    state.employeeBenefit[attribute] = value
    const savingKey = `${state.employeeBenefit.id}:${attribute}`
    if (value === persistedAttributes[attribute] && !attributeSaves.has(savingKey)) {
      delete pendingChanges[attribute]
      delete saveErrors.value[attribute]
      return
    }

    pendingChanges[attribute] = value
    void saveAttribute(attribute)
  }

  function saveAttribute(attribute: EmployeeBenefitEditableAttribute): Promise<void> {
    const employeeBenefitId = unref(id)
    if (isNil(employeeBenefitId) || isNil(state.employeeBenefit)) return Promise.resolve()

    const request = latestRequest
    const savingKey = `${employeeBenefitId}:${attribute}`
    const previousSave = attributeSaves.get(savingKey)
    if (previousSave?.request === request) return previousSave.promise

    let persistence: Promise<void>
    if (isUndefined(previousSave)) {
      persistence = persistAttribute(attribute, employeeBenefitId, request)
    } else {
      persistence = previousSave.promise.then(async () => {
        if (latestRequest !== request) return

        // The previous visit may have written after this record was fetched.
        delete persistedAttributes[attribute]
        await persistAttribute(attribute, employeeBenefitId, request)
      })
    }

    const save = persistence.finally(() => {
      if (attributeSaves.get(savingKey)?.promise === save) {
        attributeSaves.delete(savingKey)
      }
      if (latestRequest === request) {
        activeSaveCount -= 1
        state.isSaving = activeSaveCount > 0
      }
    })
    attributeSaves.set(savingKey, { request, promise: save })
    activeSaveCount += 1
    state.isSaving = true
    return save
  }

  async function persistAttribute(
    attribute: EmployeeBenefitEditableAttribute,
    employeeBenefitId: number,
    request: object
  ) {
    try {
      while (pendingChanges[attribute] !== persistedAttributes[attribute]) {
        const value = pendingChanges[attribute]
        if (isUndefined(value)) return

        await employeeBenefitsApi.update(employeeBenefitId, { [attribute]: value })
        if (latestRequest !== request) return

        persistedAttributes[attribute] = value
      }

      delete pendingChanges[attribute]
      delete saveErrors.value[attribute]
    } catch (error) {
      if (latestRequest === request) {
        saveErrors.value[attribute] = `Failed to save employee benefit: ${error}`
      }
    }
  }

  async function save() {
    const attributes = Object.keys(pendingChanges) as EmployeeBenefitEditableAttribute[]
    await Promise.all(attributes.map(saveAttribute))
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
        // fetch() records failures; explicit refresh callers still receive the rejection.
      }
    },
    { immediate: true, flush: "sync" }
  )

  return {
    ...toRefs(state),
    saveError,
    fetch,
    refresh: fetch,
    updateAttribute,
    save,
  }
}

export default useEmployeeBenefit
