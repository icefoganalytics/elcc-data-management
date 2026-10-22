import { effectScope, ref, type EffectScope } from "vue"
import { flushPromises } from "@vue/test-utils"

import wageEnhancementsApi from "@/api/wage-enhancements-api"
import { wageEnhancementFactory } from "@/tests/factories"
import useWageEnhancementEditor from "@/use/use-wage-enhancement-editor"

vi.mock("@/use/use-snack", () => ({ default: () => ({ success: vi.fn(), error: vi.fn() }) }))

let scope: EffectScope
beforeEach(() => {
  scope = effectScope()
})
afterEach(() => {
  scope.stop()
})

describe("web/src/use/use-wage-enhancement-editor.ts", () => {
  test("when a committed revert is followed by month navigation, serializes both writes and retains the returning draft", async () => {
    // Arrange
    const record1 = wageEnhancementFactory.build({
      id: 3,
      centreId: 1,
      employeeWageTierId: 2,
      employeeName: "Alex",
    })
    const record2 = wageEnhancementFactory.build({
      id: 4,
      centreId: 1,
      employeeWageTierId: 4,
      employeeName: "Robin",
    })
    const firstSave =
      Promise.withResolvers<Awaited<ReturnType<typeof wageEnhancementsApi.update>>>()
    vi.spyOn(wageEnhancementsApi, "list")
      .mockResolvedValueOnce({ wageEnhancements: [record1], totalCount: 1 })
      .mockResolvedValueOnce({ wageEnhancements: [record2], totalCount: 1 })
      .mockResolvedValueOnce({ wageEnhancements: [record1], totalCount: 1 })
    const update = vi
      .spyOn(wageEnhancementsApi, "update")
      .mockReturnValueOnce(firstSave.promise)
      .mockResolvedValue({
        wageEnhancement: record1,
        policy: { show: true, create: true, update: true, destroy: true },
      })
    const context = ref({ centreId: 1, employeeWageTierIds: [2] })
    const editor = scope.run(() => useWageEnhancementEditor(context))
    if (!editor) throw new Error("Expected an active wage editor")
    await flushPromises()
    const record = editor.wageEnhancements.value[0]

    // Act
    record.employeeName = "Alexandra"
    void editor.save(3)
    record.employeeName = "Alex"
    void editor.save(3)
    context.value = { centreId: 1, employeeWageTierIds: [4] }
    await flushPromises()
    context.value = { centreId: 1, employeeWageTierIds: [2] }
    await flushPromises()
    firstSave.resolve({
      wageEnhancement: record1,
      policy: { show: true, create: true, update: true, destroy: true },
    })
    await flushPromises()

    // Assert
    expect(update.mock.calls).toEqual([
      [3, { employeeName: "Alexandra", hoursEstimated: "0.0000", hoursActual: "0.0000" }],
      [3, { employeeName: "Alex", hoursEstimated: "0.0000", hoursActual: "0.0000" }],
    ])
    expect(editor.wageEnhancements.value[0].employeeName).toBe("Alex")
    expect(editor.pendingIds.has(3)).toBe(false)
  })

  test("when another employee is created while list loading is unavailable, retains the failed edit and the new employee", async () => {
    // Arrange
    const record1 = wageEnhancementFactory.build({
      id: 3,
      centreId: 1,
      employeeWageTierId: 2,
      employeeName: "Alex",
    })
    const record2 = wageEnhancementFactory.build({ id: 4, centreId: 1, employeeWageTierId: 2 })
    vi.spyOn(wageEnhancementsApi, "list")
      .mockResolvedValueOnce({ wageEnhancements: [record1], totalCount: 1 })
      .mockRejectedValueOnce(new Error("list unavailable"))
    vi.spyOn(wageEnhancementsApi, "update").mockRejectedValueOnce(new Error("offline"))
    vi.spyOn(wageEnhancementsApi, "create").mockResolvedValue({
      wageEnhancement: record2,
      policy: { show: true, create: true, update: true, destroy: true },
    })
    const context = ref({ centreId: 1, employeeWageTierIds: [2] })
    const editor = scope.run(() => useWageEnhancementEditor(context))
    if (!editor) throw new Error("Expected an active wage editor")
    await flushPromises()

    // Act
    editor.wageEnhancements.value[0].employeeName = "Alexandra"
    await editor.save(3)
    await editor.create(2)

    // Assert
    expect(editor.wageEnhancements.value.map(({ employeeName }) => employeeName)).toEqual([
      "Alexandra",
      record2.employeeName,
    ])
    expect(editor.errorsById.get(3)).toContain("offline")
    expect(editor.isErrored.value).toBe(false)
  })

  test("when a returning list includes a newly created employee before its create response arrives, preserves one editable row", async () => {
    // Arrange
    const record = wageEnhancementFactory.build({
      id: 3,
      centreId: 1,
      employeeWageTierId: 2,
      employeeName: "",
    })
    const created = Promise.withResolvers<Awaited<ReturnType<typeof wageEnhancementsApi.create>>>()
    const policy = { show: true, create: true, update: true, destroy: true }
    vi.spyOn(wageEnhancementsApi, "list")
      .mockResolvedValueOnce({ wageEnhancements: [], totalCount: 0 })
      .mockResolvedValueOnce({ wageEnhancements: [], totalCount: 0 })
      .mockResolvedValueOnce({ wageEnhancements: [record], totalCount: 1 })
    vi.spyOn(wageEnhancementsApi, "create").mockReturnValueOnce(created.promise)
    const context = ref({ centreId: 1, employeeWageTierIds: [2] })
    const editor = scope.run(() => useWageEnhancementEditor(context))
    if (!editor) throw new Error("Expected an active wage editor")
    await flushPromises()

    // Act
    const creation = editor.create(2)
    context.value = { centreId: 1, employeeWageTierIds: [4] }
    await flushPromises()
    context.value = { centreId: 1, employeeWageTierIds: [2] }
    await flushPromises()
    editor.wageEnhancements.value[0].employeeName = "Sam"
    created.resolve({ wageEnhancement: record, policy })
    await creation

    // Assert
    expect(editor.wageEnhancements.value).toEqual([{ ...record, employeeName: "Sam" }])
  })

  test("when an old month load finishes last, retains only the selected month records", async () => {
    // Arrange
    const record1 = wageEnhancementFactory.build({ id: 3, employeeWageTierId: 2 })
    const record2 = wageEnhancementFactory.build({ id: 4, employeeWageTierId: 4 })
    const firstLoad = Promise.withResolvers<Awaited<ReturnType<typeof wageEnhancementsApi.list>>>()
    vi.spyOn(wageEnhancementsApi, "list")
      .mockReturnValueOnce(firstLoad.promise)
      .mockResolvedValueOnce({ wageEnhancements: [record2], totalCount: 1 })
    const context = ref({ centreId: 1, employeeWageTierIds: [2] })
    const editor = scope.run(() => useWageEnhancementEditor(context))
    if (!editor) throw new Error("Expected an active wage editor")

    // Act
    context.value = { centreId: 1, employeeWageTierIds: [4] }
    await flushPromises()
    firstLoad.resolve({ wageEnhancements: [record1], totalCount: 1 })
    await flushPromises()

    // Assert
    expect(editor.wageEnhancements.value).toEqual([record2])
    expect(editor.isLoading.value).toBe(false)
  })
})
