import { effectScope, ref, type EffectScope } from "vue"
import { flushPromises, mount } from "@vue/test-utils"

import wageEnhancementsApi, { type WageEnhancementAsIndex } from "@/api/wage-enhancements-api"
import { wageEnhancementFactory } from "@/tests/factories"
import useWageEnhancements from "@/use/use-wage-enhancements"

describe("web/src/use/use-wage-enhancements.ts", () => {
  let scope: EffectScope

  beforeEach(() => {
    scope = effectScope()
  })

  afterEach(() => {
    scope.stop()
  })

  describe("useWageEnhancements", () => {
    describe("query lifecycle", () => {
      test("when an earlier query responds while its replacement is pending, keeps the latest query loading without stale results", async () => {
        // Arrange
        const wageEnhancement1 = wageEnhancementFactory.build({ id: 3, centreId: 1 })
        const firstLoad = Promise.withResolvers<{
          wageEnhancements: WageEnhancementAsIndex[]
          totalCount: number
        }>()
        const latestLoad = Promise.withResolvers<{
          wageEnhancements: WageEnhancementAsIndex[]
          totalCount: number
        }>()
        let firstSignal: AbortSignal | undefined
        let latestSignal: AbortSignal | undefined
        const list = vi.spyOn(wageEnhancementsApi, "list")
        list
          .mockImplementationOnce((_params, options) => {
            firstSignal = options?.signal
            return firstLoad.promise
          })
          .mockImplementationOnce((_params, options) => {
            latestSignal = options?.signal
            return latestLoad.promise
          })
        const query = ref({ where: { centreId: 1 } })
        const mirror = scope.run(() => useWageEnhancements(query))
        if (!mirror) throw new Error("Expected an active wage enhancement mirror")

        // Act
        query.value = { where: { centreId: 2 } }
        firstLoad.resolve({ wageEnhancements: [wageEnhancement1], totalCount: 1 })
        await flushPromises()

        // Assert
        expect(firstSignal?.aborted).toBe(true)
        expect(latestSignal?.aborted).toBe(false)
        expect(mirror.wageEnhancements.value).toEqual([])
        expect(mirror.totalCount.value).toBe(0)
        expect(mirror.isLoading.value).toBe(true)
        expect(mirror.isErrored.value).toBe(false)
      })

      test("when the replacement query completes, exposes its results without a loading error", async () => {
        // Arrange
        const wageEnhancement1 = wageEnhancementFactory.build({ id: 3, centreId: 1 })
        const wageEnhancement2 = wageEnhancementFactory.build({ id: 4, centreId: 2 })
        const firstLoad = Promise.withResolvers<{
          wageEnhancements: WageEnhancementAsIndex[]
          totalCount: number
        }>()
        vi.spyOn(wageEnhancementsApi, "list")
          .mockReturnValueOnce(firstLoad.promise)
          .mockResolvedValueOnce({ wageEnhancements: [wageEnhancement2], totalCount: 1 })
        const query = ref({ where: { centreId: 1 } })
        const mirror = scope.run(() => useWageEnhancements(query))
        if (!mirror) throw new Error("Expected an active wage enhancement mirror")

        // Act
        query.value = { where: { centreId: 2 } }
        firstLoad.resolve({ wageEnhancements: [wageEnhancement1], totalCount: 1 })
        await flushPromises()

        // Assert
        expect(mirror.wageEnhancements.value).toEqual([wageEnhancement2])
        expect(mirror.totalCount.value).toBe(1)
        expect(mirror.isLoading.value).toBe(false)
        expect(mirror.isErrored.value).toBe(false)
      })

      test("when the latest query fails, an aborted older response cannot clear its error", async () => {
        // Arrange
        const staleWageEnhancement = wageEnhancementFactory.build({ id: 3, centreId: 1 })
        const loadError = new Error("Latest wage enhancements are unavailable")
        const firstLoad = Promise.withResolvers<{
          wageEnhancements: WageEnhancementAsIndex[]
          totalCount: number
        }>()
        let firstSignal: AbortSignal | undefined
        vi.spyOn(wageEnhancementsApi, "list")
          .mockImplementationOnce((_params, options) => {
            firstSignal = options?.signal
            return firstLoad.promise
          })
          .mockRejectedValueOnce(loadError)
        const query = ref({ where: { centreId: 1 } })
        const wrapper = mount(
          {
            setup: () => useWageEnhancements(query),
            render: () => null,
          },
          { global: { config: { errorHandler: vi.fn() } } }
        )

        // Act
        query.value = { where: { centreId: 2 } }
        await flushPromises()
        firstLoad.resolve({ wageEnhancements: [staleWageEnhancement], totalCount: 1 })
        await flushPromises()

        // Assert
        expect(firstSignal?.aborted).toBe(true)
        expect(wrapper.vm.wageEnhancements).toEqual([])
        expect(wrapper.vm.totalCount).toBe(0)
        expect(wrapper.vm.isLoading).toBe(false)
        expect(wrapper.vm.isErrored).toBe(true)
      })

      test("when the latest query fails, forwards its error to the global handler", async () => {
        // Arrange
        const staleWageEnhancement = wageEnhancementFactory.build({ id: 3, centreId: 1 })
        const loadError = new Error("Latest wage enhancements are unavailable")
        const handleError = vi.fn()
        const firstLoad = Promise.withResolvers<{
          wageEnhancements: WageEnhancementAsIndex[]
          totalCount: number
        }>()
        vi.spyOn(wageEnhancementsApi, "list")
          .mockImplementationOnce(() => firstLoad.promise)
          .mockRejectedValueOnce(loadError)
        const query = ref({ where: { centreId: 1 } })
        mount(
          {
            setup: () => useWageEnhancements(query),
            render: () => null,
          },
          { global: { config: { errorHandler: handleError } } }
        )

        // Act
        query.value = { where: { centreId: 2 } }
        await flushPromises()
        firstLoad.resolve({ wageEnhancements: [staleWageEnhancement], totalCount: 1 })
        await flushPromises()

        // Assert
        expect(handleError.mock.calls.map(([error]) => error)).toEqual([loadError])
      })

      test("when list watching is skipped, aborts the pending request", async () => {
        // Arrange
        const firstLoad = Promise.withResolvers<{
          wageEnhancements: WageEnhancementAsIndex[]
          totalCount: number
        }>()
        const shouldSkip = ref(false)
        let requestSignal: AbortSignal | undefined
        vi.spyOn(wageEnhancementsApi, "list").mockImplementationOnce((_params, options) => {
          requestSignal = options?.signal
          return firstLoad.promise
        })
        const mirror = scope.run(() =>
          useWageEnhancements(ref({}), { skipWatchIf: () => shouldSkip.value })
        )
        if (!mirror) throw new Error("Expected an active wage enhancement mirror")

        // Act
        shouldSkip.value = true

        firstLoad.resolve({
          wageEnhancements: [wageEnhancementFactory.build({ id: 3, centreId: 1 })],
          totalCount: 1,
        })
        await flushPromises()

        // Assert
        expect(requestSignal?.aborted).toBe(true)
        expect(mirror.isLoading.value).toBe(false)
        expect(mirror.wageEnhancements.value).toEqual([])
        expect(mirror.totalCount.value).toBe(0)
        expect(mirror.isErrored.value).toBe(false)
      })

      test("when its effect scope is disposed, aborts the pending request", async () => {
        // Arrange
        const firstLoad = Promise.withResolvers<{
          wageEnhancements: WageEnhancementAsIndex[]
          totalCount: number
        }>()
        let requestSignal: AbortSignal | undefined
        vi.spyOn(wageEnhancementsApi, "list").mockImplementationOnce((_params, options) => {
          requestSignal = options?.signal
          return firstLoad.promise
        })
        const mirror = scope.run(() => useWageEnhancements())
        if (!mirror) throw new Error("Expected an active wage enhancement mirror")

        // Act
        scope.stop()

        firstLoad.resolve({
          wageEnhancements: [wageEnhancementFactory.build({ id: 3, centreId: 1 })],
          totalCount: 1,
        })
        await flushPromises()

        // Assert
        expect(requestSignal?.aborted).toBe(true)
        expect(mirror.wageEnhancements.value).toEqual([])
        expect(mirror.totalCount.value).toBe(0)
      })
    })
  })
})
