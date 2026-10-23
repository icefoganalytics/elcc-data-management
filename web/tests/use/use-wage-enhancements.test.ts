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
      test("when an earlier query responds while its replacement is pending, keeps the latest query loading", async () => {
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
        vi.spyOn(wageEnhancementsApi, "list")
          .mockReturnValueOnce(firstLoad.promise)
          .mockReturnValueOnce(latestLoad.promise)
        const query = ref({ where: { centreId: 1 } })
        const mirror = scope.run(() => useWageEnhancements(query))
        if (!mirror) throw new Error("Expected an active wage enhancement mirror")

        // Act
        query.value = { where: { centreId: 2 } }
        firstLoad.resolve({ wageEnhancements: [wageEnhancement1], totalCount: 1 })
        await flushPromises()

        // Assert
        expect(mirror.isLoading.value).toBe(true)
      })

      test("when an earlier query responds while its replacement is pending, does not expose stale results", async () => {
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
        vi.spyOn(wageEnhancementsApi, "list")
          .mockReturnValueOnce(firstLoad.promise)
          .mockReturnValueOnce(latestLoad.promise)
        const query = ref({ where: { centreId: 1 } })
        const mirror = scope.run(() => useWageEnhancements(query))
        if (!mirror) throw new Error("Expected an active wage enhancement mirror")

        // Act
        query.value = { where: { centreId: 2 } }
        firstLoad.resolve({ wageEnhancements: [wageEnhancement1], totalCount: 1 })
        await flushPromises()

        // Assert
        expect(mirror.wageEnhancements.value).toEqual([])
      })

      test("when a query is superseded, aborts its request", async () => {
        // Arrange
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
          .mockResolvedValueOnce({ wageEnhancements: [], totalCount: 0 })
        const query = ref({ where: { centreId: 1 } })
        const mirror = scope.run(() => useWageEnhancements(query))
        if (!mirror) throw new Error("Expected an active wage enhancement mirror")

        // Act
        query.value = { where: { centreId: 2 } }
        await flushPromises()

        // Assert
        expect(firstSignal?.aborted).toBe(true)
      })

      test("when a query is superseded, does not abort the replacement request", async () => {
        // Arrange
        const firstLoad = Promise.withResolvers<{
          wageEnhancements: WageEnhancementAsIndex[]
          totalCount: number
        }>()
        const latestLoad = Promise.withResolvers<{
          wageEnhancements: WageEnhancementAsIndex[]
          totalCount: number
        }>()
        let latestSignal: AbortSignal | undefined
        vi.spyOn(wageEnhancementsApi, "list")
          .mockReturnValueOnce(firstLoad.promise)
          .mockImplementationOnce((_params, options) => {
            latestSignal = options?.signal
            return latestLoad.promise
          })
        const query = ref({ where: { centreId: 1 } })
        const mirror = scope.run(() => useWageEnhancements(query))
        if (!mirror) throw new Error("Expected an active wage enhancement mirror")

        // Act
        query.value = { where: { centreId: 2 } }
        await flushPromises()

        // Assert
        expect(latestSignal?.aborted).toBe(false)
      })

      test("when the replacement query completes, exposes its results", async () => {
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
      })

      test("when the replacement query completes, exposes its total count", async () => {
        // Arrange
        const firstLoad = Promise.withResolvers<{
          wageEnhancements: WageEnhancementAsIndex[]
          totalCount: number
        }>()
        vi.spyOn(wageEnhancementsApi, "list")
          .mockReturnValueOnce(firstLoad.promise)
          .mockResolvedValueOnce({ wageEnhancements: [], totalCount: 7 })
        const query = ref({ where: { centreId: 1 } })
        const mirror = scope.run(() => useWageEnhancements(query))
        if (!mirror) throw new Error("Expected an active wage enhancement mirror")

        // Act
        query.value = { where: { centreId: 2 } }
        firstLoad.resolve({ wageEnhancements: [], totalCount: 1 })
        await flushPromises()

        // Assert
        expect(mirror.totalCount.value).toBe(7)
      })

      test("when the replacement query completes, finishes loading", async () => {
        // Arrange
        const firstLoad = Promise.withResolvers<{
          wageEnhancements: WageEnhancementAsIndex[]
          totalCount: number
        }>()
        vi.spyOn(wageEnhancementsApi, "list")
          .mockReturnValueOnce(firstLoad.promise)
          .mockResolvedValueOnce({ wageEnhancements: [], totalCount: 1 })
        const query = ref({ where: { centreId: 1 } })
        const mirror = scope.run(() => useWageEnhancements(query))
        if (!mirror) throw new Error("Expected an active wage enhancement mirror")

        // Act
        query.value = { where: { centreId: 2 } }
        firstLoad.resolve({ wageEnhancements: [], totalCount: 1 })
        await flushPromises()

        // Assert
        expect(mirror.isLoading.value).toBe(false)
      })

      test("when a new query succeeds after a failed query, clears the error state", async () => {
        // Arrange
        vi.spyOn(wageEnhancementsApi, "list")
          .mockRejectedValueOnce(new Error("offline"))
          .mockResolvedValueOnce({ wageEnhancements: [], totalCount: 0 })
        const query = ref({ where: { centreId: 1 } })
        const wrapper = mount(
          {
            setup: () => useWageEnhancements(query),
            render: () => null,
          },
          { global: { config: { errorHandler: vi.fn() } } }
        )
        await flushPromises()

        // Act
        query.value = { where: { centreId: 2 } }
        await flushPromises()

        // Assert
        expect(wrapper.vm.isErrored).toBe(false)
      })

      test("when the latest query fails, retains the error state after an aborted older response", async () => {
        // Arrange
        const staleWageEnhancement = wageEnhancementFactory.build({ id: 3, centreId: 1 })
        const loadError = new Error("Latest wage enhancements are unavailable")
        const firstLoad = Promise.withResolvers<{
          wageEnhancements: WageEnhancementAsIndex[]
          totalCount: number
        }>()
        vi.spyOn(wageEnhancementsApi, "list")
          .mockReturnValueOnce(firstLoad.promise)
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
        expect(wrapper.vm.isErrored).toBe(true)
      })

      test("when the latest query fails, finishes loading after an aborted older response", async () => {
        // Arrange
        const staleWageEnhancement = wageEnhancementFactory.build({ id: 3, centreId: 1 })
        const loadError = new Error("Latest wage enhancements are unavailable")
        const firstLoad = Promise.withResolvers<{
          wageEnhancements: WageEnhancementAsIndex[]
          totalCount: number
        }>()
        vi.spyOn(wageEnhancementsApi, "list")
          .mockReturnValueOnce(firstLoad.promise)
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
        expect(wrapper.vm.isLoading).toBe(false)
      })

      test("when the latest query fails, does not expose an aborted older response", async () => {
        // Arrange
        const staleWageEnhancement = wageEnhancementFactory.build({ id: 3, centreId: 1 })
        const loadError = new Error("Latest wage enhancements are unavailable")
        const firstLoad = Promise.withResolvers<{
          wageEnhancements: WageEnhancementAsIndex[]
          totalCount: number
        }>()
        vi.spyOn(wageEnhancementsApi, "list")
          .mockReturnValueOnce(firstLoad.promise)
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
        expect(wrapper.vm.wageEnhancements).toEqual([])
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
        firstLoad.resolve({ wageEnhancements: [], totalCount: 0 })
        await flushPromises()

        // Assert
        expect(requestSignal?.aborted).toBe(true)
      })

      test("when list watching is skipped, clears its results", async () => {
        // Arrange
        const firstLoad = Promise.withResolvers<{
          wageEnhancements: WageEnhancementAsIndex[]
          totalCount: number
        }>()
        const shouldSkip = ref(false)
        vi.spyOn(wageEnhancementsApi, "list").mockReturnValueOnce(firstLoad.promise)
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
        expect(mirror.wageEnhancements.value).toEqual([])
      })

      test("when list watching is skipped, finishes loading", async () => {
        // Arrange
        const firstLoad = Promise.withResolvers<{
          wageEnhancements: WageEnhancementAsIndex[]
          totalCount: number
        }>()
        const shouldSkip = ref(false)
        vi.spyOn(wageEnhancementsApi, "list").mockReturnValueOnce(firstLoad.promise)
        const mirror = scope.run(() =>
          useWageEnhancements(ref({}), { skipWatchIf: () => shouldSkip.value })
        )
        if (!mirror) throw new Error("Expected an active wage enhancement mirror")

        // Act
        shouldSkip.value = true
        firstLoad.resolve({ wageEnhancements: [], totalCount: 0 })
        await flushPromises()

        // Assert
        expect(mirror.isLoading.value).toBe(false)
      })

      test("when list watching is skipped after a failed query, clears the error state", async () => {
        // Arrange
        const shouldSkip = ref(false)
        vi.spyOn(wageEnhancementsApi, "list").mockRejectedValueOnce(new Error("offline"))
        const wrapper = mount(
          {
            setup: () => useWageEnhancements(ref({}), { skipWatchIf: () => shouldSkip.value }),
            render: () => null,
          },
          { global: { config: { errorHandler: vi.fn() } } }
        )
        await flushPromises()

        // Act
        shouldSkip.value = true
        await flushPromises()

        // Assert
        expect(wrapper.vm.isErrored).toBe(false)
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
        firstLoad.resolve({ wageEnhancements: [], totalCount: 0 })
        await flushPromises()

        // Assert
        expect(requestSignal?.aborted).toBe(true)
      })

      test("when its effect scope is disposed, does not expose the pending response", async () => {
        // Arrange
        const firstLoad = Promise.withResolvers<{
          wageEnhancements: WageEnhancementAsIndex[]
          totalCount: number
        }>()
        vi.spyOn(wageEnhancementsApi, "list").mockReturnValueOnce(firstLoad.promise)
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
        expect(mirror.wageEnhancements.value).toEqual([])
      })
    })
  })
})
