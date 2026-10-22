import { effectScope, ref, type EffectScope } from "vue"
import { flushPromises } from "@vue/test-utils"

import wageEnhancementsApi from "@/api/wage-enhancements-api"
import { wageEnhancementFactory } from "@/tests/factories"
import useWageEnhancements from "@/use/use-wage-enhancements"

let scope: EffectScope
beforeEach(() => {
  scope = effectScope()
})
afterEach(() => {
  scope.stop()
})

describe("web/src/use/use-wage-enhancements.ts", () => {
  test("when an earlier query finishes last, retains the latest query results and loading state", async () => {
    // Arrange
    const wageEnhancement1 = wageEnhancementFactory.build({ id: 3, centreId: 1 })
    const wageEnhancement2 = wageEnhancementFactory.build({ id: 4, centreId: 2 })
    const firstLoad = Promise.withResolvers<Awaited<ReturnType<typeof wageEnhancementsApi.list>>>()
    vi.spyOn(wageEnhancementsApi, "list")
      .mockReturnValueOnce(firstLoad.promise)
      .mockResolvedValueOnce({ wageEnhancements: [wageEnhancement2], totalCount: 1 })
    const query = ref({ where: { centreId: 1 } })
    const mirror = scope.run(() => useWageEnhancements(query))
    if (!mirror) throw new Error("Expected an active wage enhancement mirror")

    // Act
    query.value = { where: { centreId: 2 } }
    await flushPromises()
    firstLoad.resolve({ wageEnhancements: [wageEnhancement1], totalCount: 1 })
    await flushPromises()

    // Assert
    expect(mirror.wageEnhancements.value).toEqual([wageEnhancement2])
    expect(mirror.totalCount.value).toBe(1)
    expect(mirror.isLoading.value).toBe(false)
    expect(mirror.isErrored.value).toBe(false)
  })
})
