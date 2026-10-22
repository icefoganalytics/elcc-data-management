import { computed, reactive, ref, watch, type Ref } from "vue"
import { isEqual } from "lodash"

import { MAX_PER_PAGE } from "@/api/base-api"
import wageEnhancementsApi, {
  type WageEnhancement,
  type WageEnhancementAsIndex,
} from "@/api/wage-enhancements-api"
import useSnack from "@/use/use-snack"

type EditableAttributes = Pick<WageEnhancement, "employeeName" | "hoursEstimated" | "hoursActual">
type EditingContext = { centreId: number; employeeWageTierIds: number[] }

function editableAttributes(wageEnhancement: WageEnhancement): EditableAttributes {
  return {
    employeeName: wageEnhancement.employeeName,
    hoursEstimated: wageEnhancement.hoursEstimated,
    hoursActual: wageEnhancement.hoursActual,
  }
}

export function useWageEnhancementEditor(context: Ref<EditingContext | undefined>) {
  const records = reactive(new Map<number, WageEnhancementAsIndex>())
  const persistedAttributes = new Map<number, EditableAttributes>()
  const pendingChanges = new Map<number, EditableAttributes>()
  const activeWrites = new Map<number, Promise<void>>()
  const visibleIds = ref<number[]>([])
  const pendingIds = reactive(new Set<number>())
  const errorsById = reactive(new Map<number, string>())
  const isLoading = ref(false)
  const isErrored = ref(false)
  const isCreating = ref(false)
  const snack = useSnack()
  let latestRequest = {}

  const wageEnhancements = computed(() => {
    const visibleRecords: WageEnhancementAsIndex[] = []
    for (const id of visibleIds.value) {
      const record = records.get(id)
      if (record) visibleRecords.push(record)
    }
    return visibleRecords
  })

  async function fetch() {
    const selectedContext = context.value
    if (!selectedContext) return

    const request = {}
    latestRequest = request
    const baselineAtFetch = new Map(persistedAttributes)
    isLoading.value = true
    isErrored.value = false
    try {
      const { wageEnhancements } = await wageEnhancementsApi.list({
        where: {
          centreId: selectedContext.centreId,
          employeeWageTierId: selectedContext.employeeWageTierIds,
        },
        perPage: MAX_PER_PAGE,
      })
      if (latestRequest !== request) return

      for (const incoming of wageEnhancements) {
        const record = records.get(incoming.id)
        const baseline = persistedAttributes.get(incoming.id)
        const hasLocalChanges = record && !isEqual(editableAttributes(record), baseline)
        const wasSavedDuringFetch = baseline !== baselineAtFetch.get(incoming.id)
        if (hasLocalChanges || activeWrites.has(incoming.id) || wasSavedDuringFetch) continue

        records.set(incoming.id, { ...incoming })
        persistedAttributes.set(incoming.id, editableAttributes(incoming))
      }
      visibleIds.value = wageEnhancements.map(({ id }) => id)
    } catch (error) {
      if (latestRequest !== request) return

      isErrored.value = true
      console.error(`Failed to fetch wage enhancements: ${error}`, { error })
    } finally {
      if (latestRequest === request) isLoading.value = false
    }
  }

  function save(id: number): Promise<void> {
    const record = records.get(id)
    if (!record) return Promise.resolve()

    pendingChanges.set(id, editableAttributes(record))
    const activeWrite = activeWrites.get(id)
    if (activeWrite) return activeWrite

    if (isEqual(pendingChanges.get(id), persistedAttributes.get(id))) {
      pendingChanges.delete(id)
      errorsById.delete(id)
      return Promise.resolve()
    }

    pendingIds.add(id)
    const write = persist(id).finally(() => {
      pendingIds.delete(id)
      activeWrites.delete(id)
    })
    activeWrites.set(id, write)
    return write
  }

  async function persist(id: number) {
    try {
      while (!isEqual(pendingChanges.get(id), persistedAttributes.get(id))) {
        const attributes = pendingChanges.get(id)
        if (!attributes) return

        await wageEnhancementsApi.update(id, attributes)
        persistedAttributes.set(id, attributes)
      }
      pendingChanges.delete(id)
      errorsById.delete(id)
    } catch (error) {
      errorsById.set(id, String(error))
      console.error(`Failed to save wage enhancement: ${error}`, { error })
      snack.error(`Failed to save wage enhancement: ${error}`)
    }
  }

  async function create(employeeWageTierId: number) {
    const selectedContext = context.value
    if (!selectedContext) return

    isCreating.value = true
    try {
      const { wageEnhancement } = await wageEnhancementsApi.create({
        centreId: selectedContext.centreId,
        employeeWageTierId,
        employeeName: "",
        hoursEstimated: "0.0000",
        hoursActual: "0.0000",
      })
      if (!records.has(wageEnhancement.id)) {
        records.set(wageEnhancement.id, { ...wageEnhancement })
        persistedAttributes.set(wageEnhancement.id, editableAttributes(wageEnhancement))
      }
      if (
        context.value?.centreId === selectedContext.centreId &&
        context.value.employeeWageTierIds.includes(employeeWageTierId) &&
        !visibleIds.value.includes(wageEnhancement.id)
      ) {
        visibleIds.value.push(wageEnhancement.id)
      }
      snack.success("Wage enhancement created")
    } catch (error) {
      console.error(`Failed to create wage enhancement: ${error}`, { error })
      snack.error(`Failed to create wage enhancement: ${error}`)
    } finally {
      isCreating.value = false
    }
  }

  async function remove(id: number) {
    await activeWrites.get(id)
    pendingIds.add(id)
    try {
      await wageEnhancementsApi.delete(id)
      records.delete(id)
      persistedAttributes.delete(id)
      pendingChanges.delete(id)
      errorsById.delete(id)
      visibleIds.value = visibleIds.value.filter((visibleId) => visibleId !== id)
      snack.success("Wage enhancement deleted.")
    } catch (error) {
      console.error(`Failed to delete wage enhancement: ${error}`, { error })
      snack.error(`Failed to delete wage enhancement: ${error}`)
    } finally {
      pendingIds.delete(id)
    }
  }

  watch(
    context,
    () => {
      latestRequest = {}
      visibleIds.value = []
      isLoading.value = false
      isErrored.value = false
      void fetch()
    },
    { immediate: true, flush: "sync" }
  )

  return {
    wageEnhancements,
    isLoading,
    isErrored,
    isCreating,
    pendingIds,
    errorsById,
    save,
    create,
    remove,
  }
}

export default useWageEnhancementEditor
