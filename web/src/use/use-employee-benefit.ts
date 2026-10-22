import { computed, reactive, shallowRef, toRefs, unref, watch, type Ref } from "vue"
import { isNil, isUndefined } from "lodash"

import employeeBenefitsApi, {
  type EmployeeBenefitAsShow,
  type EmployeeBenefitPolicy,
} from "@/api/employee-benefits-api"

export { type EmployeeBenefitAsShow }

const EDITABLE_ATTRIBUTES = [
  "grossPayrollMonthlyActual",
  "grossPayrollMonthlyEstimated",
  "costCapPercentage",
  "employeeCostActual",
  "employeeCostEstimated",
  "employerCostActual",
  "employerCostEstimated",
] as const
export type EmployeeBenefitEditableAttribute = (typeof EDITABLE_ATTRIBUTES)[number]
type EmployeeBenefitChanges = Partial<Pick<EmployeeBenefitAsShow, EmployeeBenefitEditableAttribute>>
type RecordEditor = {
  record: EmployeeBenefitAsShow | null
  persistedAttributes: EmployeeBenefitChanges
  pendingChanges: EmployeeBenefitChanges
  writeRevisions: Partial<Record<EmployeeBenefitEditableAttribute, number>>
  saveErrors: Partial<Record<EmployeeBenefitEditableAttribute, string>>
  savingAttributes: Set<EmployeeBenefitEditableAttribute>
  writes: Map<EmployeeBenefitEditableAttribute, Promise<void>>
}

export function useEmployeeBenefit(id: Ref<number | null | undefined>) {
  const state = reactive<{
    employeeBenefit: EmployeeBenefitAsShow | null
    policy: EmployeeBenefitPolicy | null
    isLoading: boolean
    isErrored: boolean
  }>({ employeeBenefit: null, policy: null, isLoading: false, isErrored: false })
  // The page keeps this owner alive while month-specific records are being discovered.
  const editors = new Map<number, RecordEditor>()
  const currentEditor = shallowRef<RecordEditor>()
  const isSaving = computed(() => (currentEditor.value?.savingAttributes.size ?? 0) > 0)
  const saveError = computed(
    () => Object.values(currentEditor.value?.saveErrors ?? {}).find(Boolean) ?? ""
  )
  let latestRequest = {}

  function clearRecord() {
    latestRequest = {}
    state.employeeBenefit = null
    state.policy = null
    state.isLoading = false
    state.isErrored = false
    currentEditor.value = undefined
  }

  async function fetch(): Promise<EmployeeBenefitAsShow> {
    const employeeBenefitId = unref(id)
    if (isNil(employeeBenefitId)) throw new Error("id is required")

    clearRecord()
    const request = latestRequest
    let editor = editors.get(employeeBenefitId)
    if (isUndefined(editor)) {
      editor = reactive<RecordEditor>({
        record: null,
        persistedAttributes: {},
        pendingChanges: {},
        writeRevisions: {},
        saveErrors: {},
        savingAttributes: new Set(),
        writes: new Map(),
      })
      editors.set(employeeBenefitId, editor)
    }
    currentEditor.value = editor
    const revisionsAtFetch = { ...editor.writeRevisions }
    state.isLoading = true
    try {
      const { employeeBenefit, policy } = await employeeBenefitsApi.get(employeeBenefitId)
      if (latestRequest !== request) return employeeBenefit

      const record = { ...employeeBenefit }
      for (const attribute of EDITABLE_ATTRIBUTES) {
        const retainedValue = editor.record?.[attribute] ?? editor.persistedAttributes[attribute]
        const hasPendingChange = !isUndefined(editor.pendingChanges[attribute])
        const wasSavedDuringFetch = editor.writeRevisions[attribute] !== revisionsAtFetch[attribute]
        if ((hasPendingChange || wasSavedDuringFetch) && !isUndefined(retainedValue)) {
          record[attribute] = retainedValue
          continue
        }
        editor.persistedAttributes[attribute] = record[attribute]
      }
      editor.record = record
      state.employeeBenefit = editor.record
      state.policy = policy
      return record
    } catch (error) {
      console.error(`Failed to fetch employee benefit: ${error}`, { error })
      if (latestRequest === request) state.isErrored = true
      throw error
    } finally {
      if (latestRequest === request) state.isLoading = false
    }
  }

  function updateAttribute(attribute: EmployeeBenefitEditableAttribute, value: string) {
    const editor = currentEditor.value
    const employeeBenefitId = unref(id)
    if (!editor?.record || isNil(state.employeeBenefit) || isNil(employeeBenefitId)) return

    editor.record[attribute] = value
    if (value === editor.persistedAttributes[attribute] && !editor.writes.has(attribute)) {
      delete editor.pendingChanges[attribute]
      delete editor.saveErrors[attribute]
      return
    }
    editor.pendingChanges[attribute] = value
    void saveAttribute(editor, employeeBenefitId, attribute)
  }

  function saveAttribute(
    editor: RecordEditor,
    employeeBenefitId: number,
    attribute: EmployeeBenefitEditableAttribute
  ): Promise<void> {
    const activeWrite = editor.writes.get(attribute)
    if (activeWrite) return activeWrite

    editor.savingAttributes.add(attribute)
    const write = persistAttribute(editor, employeeBenefitId, attribute).finally(() => {
      editor.savingAttributes.delete(attribute)
      editor.writes.delete(attribute)
    })
    editor.writes.set(attribute, write)
    return write
  }

  async function persistAttribute(
    editor: RecordEditor,
    employeeBenefitId: number,
    attribute: EmployeeBenefitEditableAttribute
  ) {
    try {
      while (editor.pendingChanges[attribute] !== editor.persistedAttributes[attribute]) {
        const value = editor.pendingChanges[attribute]
        if (isUndefined(value)) return

        await employeeBenefitsApi.update(employeeBenefitId, { [attribute]: value })
        editor.persistedAttributes[attribute] = value
        editor.writeRevisions[attribute] = (editor.writeRevisions[attribute] ?? 0) + 1
      }
      delete editor.pendingChanges[attribute]
      delete editor.saveErrors[attribute]
    } catch (error) {
      editor.saveErrors[attribute] = `Failed to save employee benefit: ${error}`
      console.error(`Failed to save employee benefit: ${error}`, { error })
    }
  }

  async function save() {
    const editor = currentEditor.value
    const employeeBenefitId = unref(id)
    if (!editor || isNil(employeeBenefitId)) return

    const attributes = EDITABLE_ATTRIBUTES.filter(
      (attribute) => !isUndefined(editor.pendingChanges[attribute])
    )
    await Promise.all(
      attributes.map((attribute) => saveAttribute(editor, employeeBenefitId, attribute))
    )
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

  return { ...toRefs(state), isSaving, saveError, fetch, refresh: fetch, updateAttribute, save }
}

export default useEmployeeBenefit
