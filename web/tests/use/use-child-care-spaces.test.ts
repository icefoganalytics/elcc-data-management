import { flushPromises } from "@vue/test-utils"
import { type GenericAbortSignal } from "axios"
import { effectScope, nextTick, ref } from "vue"

import httpClient from "@/api/http-client"
import { type ChildCareSpace } from "@/api/child-care-spaces-api"
import { childCareSpaceFactory } from "@/tests/factories"

import useChildCareSpaces from "@/use/use-child-care-spaces"

type ListResponse = {
  data: {
    childCareSpaces: ChildCareSpace[]
    totalCount: number
  }
}

describe("web/src/use/use-child-care-spaces.ts", () => {
  describe("useChildCareSpaces", () => {
    describe("latest query ownership", () => {
      test("when an older query resolves last, retains the selected centre's records", async ({
        onTestFinished,
      }) => {
        // Arrange
        const older = Promise.withResolvers<ListResponse>()
        const selected = childCareSpaceFactory.build({ centreId: 2 })
        const previous = childCareSpaceFactory.build({ centreId: 1 })
        vi.mocked(httpClient, true)
          .get.mockReturnValueOnce(older.promise)
          .mockResolvedValueOnce({ data: { childCareSpaces: [selected], totalCount: 1 } })
        const query = ref({ where: { centreId: 1 } })
        const scope = effectScope()
        onTestFinished(() => scope.stop())
        const spaces = scope.run(() => useChildCareSpaces(query))
        if (spaces === undefined) throw new Error("The test scope must be active")

        // Act
        query.value = { where: { centreId: 2 } }
        await flushPromises()
        older.resolve({ data: { childCareSpaces: [previous], totalCount: 9 } })
        await flushPromises()

        // Assert
        expect(spaces.childCareSpaces.value).toEqual([selected])
      })

      test("when an older query resolves last, retains the selected query's count", async ({
        onTestFinished,
      }) => {
        // Arrange
        const older = Promise.withResolvers<ListResponse>()
        vi.mocked(httpClient, true)
          .get.mockReturnValueOnce(older.promise)
          .mockResolvedValueOnce({ data: { childCareSpaces: [], totalCount: 12 } })
        const query = ref({ filters: { byFiscalYear: "2024-25" } })
        const scope = effectScope()
        onTestFinished(() => scope.stop())
        const spaces = scope.run(() => useChildCareSpaces(query))
        if (spaces === undefined) throw new Error("The test scope must be active")

        // Act
        query.value = { filters: { byFiscalYear: "2025-26" } }
        await flushPromises()
        older.resolve({ data: { childCareSpaces: [], totalCount: 3 } })
        await flushPromises()

        // Assert
        expect(spaces.totalCount.value).toEqual(12)
      })

      test("when an older query completes while its replacement is pending, keeps loading", async ({
        onTestFinished,
      }) => {
        // Arrange
        const older = Promise.withResolvers<ListResponse>()
        const current = Promise.withResolvers<ListResponse>()
        vi.mocked(httpClient, true)
          .get.mockReturnValueOnce(older.promise)
          .mockReturnValueOnce(current.promise)
        const query = ref({ where: { centreId: 1 } })
        const scope = effectScope()
        onTestFinished(() => scope.stop())
        const spaces = scope.run(() => useChildCareSpaces(query))
        if (spaces === undefined) throw new Error("The test scope must be active")

        // Act
        query.value = { where: { centreId: 2 } }
        await nextTick()
        older.resolve({ data: { childCareSpaces: [], totalCount: 0 } })
        await flushPromises()

        // Assert
        expect(spaces.isLoading.value).toEqual(true)
      })

      test("when an older query fails after the selected query succeeds, keeps the selected query error-free", async ({
        onTestFinished,
      }) => {
        // Arrange
        const older = Promise.withResolvers<ListResponse>()
        vi.mocked(httpClient, true)
          .get.mockReturnValueOnce(older.promise)
          .mockResolvedValueOnce({ data: { childCareSpaces: [], totalCount: 0 } })
        const query = ref({ where: { centreId: 1 } })
        const scope = effectScope()
        onTestFinished(() => scope.stop())
        const spaces = scope.run(() => useChildCareSpaces(query))
        if (spaces === undefined) throw new Error("The test scope must be active")

        // Act
        query.value = { where: { centreId: 2 } }
        await flushPromises()
        older.reject(new Error("Old request failed"))
        await flushPromises()

        // Assert
        expect(spaces.isErrored.value).toEqual(false)
      })

      test("when an older success follows a current failure, preserves the current error state", async ({
        onTestFinished,
      }) => {
        // Arrange
        const older = Promise.withResolvers<ListResponse>()
        vi.mocked(httpClient, true)
          .get.mockReturnValueOnce(older.promise)
          .mockRejectedValueOnce(new Error("Current request failed"))
        const scope = effectScope()
        onTestFinished(() => scope.stop())
        const query = ref({})
        const spaces = scope.run(() => useChildCareSpaces(query, { skipWatchIf: () => true }))
        if (spaces === undefined) throw new Error("The test scope must be active")
        const previousFetch = spaces.fetch()

        // Act
        await spaces.refresh().catch(() => undefined)
        older.resolve({ data: { childCareSpaces: [], totalCount: 0 } })
        await previousFetch

        // Assert
        expect(spaces.isErrored.value).toEqual(true)
      })

      test("when the current request fails, rejects to its caller", async ({ onTestFinished }) => {
        // Arrange
        vi.mocked(httpClient, true).get.mockRejectedValueOnce(new Error("Current request failed"))
        const scope = effectScope()
        onTestFinished(() => scope.stop())
        const query = ref({})
        const spaces = scope.run(() => useChildCareSpaces(query, { skipWatchIf: () => true }))
        if (spaces === undefined) throw new Error("The test scope must be active")

        // Act / Assert
        await expect(spaces.fetch()).rejects.toThrow("Current request failed")
      })

      test("when the current request succeeds, completes loading", async ({ onTestFinished }) => {
        // Arrange
        vi.mocked(httpClient, true).get.mockResolvedValueOnce({
          data: { childCareSpaces: [], totalCount: 0 },
        })
        const scope = effectScope()
        onTestFinished(() => scope.stop())
        const query = ref({})
        const spaces = scope.run(() => useChildCareSpaces(query, { skipWatchIf: () => true }))
        if (spaces === undefined) throw new Error("The test scope must be active")

        // Act
        await spaces.fetch()

        // Assert
        expect(spaces.isLoading.value).toEqual(false)
      })
    })

    describe("request cancellation", () => {
      test("when the selected year changes, aborts the previous HTTP request", async ({
        onTestFinished,
      }) => {
        // Arrange
        const pending = Promise.withResolvers<ListResponse>()
        let signal: GenericAbortSignal | undefined
        vi.mocked(httpClient, true)
          .get.mockImplementationOnce((_url, options) => {
            signal = options?.signal
            return pending.promise
          })
          .mockResolvedValueOnce({ data: { childCareSpaces: [], totalCount: 0 } })
        const query = ref({ filters: { byFiscalYear: "2024-25" } })
        const scope = effectScope()
        onTestFinished(() => scope.stop())
        scope.run(() => useChildCareSpaces(query))

        // Act
        query.value = { filters: { byFiscalYear: "2025-26" } }
        await flushPromises()

        // Assert
        expect(signal?.aborted).toEqual(true)
      })

      test("when watching becomes skipped, ignores the pending response", async ({
        onTestFinished,
      }) => {
        // Arrange
        const pending = Promise.withResolvers<ListResponse>()
        const previous = childCareSpaceFactory.build({ centreId: 1 })
        vi.mocked(httpClient, true).get.mockReturnValueOnce(pending.promise)
        const skip = ref(false)
        const scope = effectScope()
        onTestFinished(() => scope.stop())
        const query = ref({})
        const spaces = scope.run(() => useChildCareSpaces(query, { skipWatchIf: () => skip.value }))
        if (spaces === undefined) throw new Error("The test scope must be active")

        // Act
        skip.value = true
        await nextTick()
        pending.resolve({ data: { childCareSpaces: [previous], totalCount: 1 } })
        await flushPromises()

        // Assert
        expect(spaces.childCareSpaces.value).toEqual([])
      })

      test("when watching becomes skipped, ends the abandoned loader", async ({
        onTestFinished,
      }) => {
        // Arrange
        const pending = Promise.withResolvers<ListResponse>()
        vi.mocked(httpClient, true).get.mockReturnValueOnce(pending.promise)
        const skip = ref(false)
        const scope = effectScope()
        onTestFinished(() => scope.stop())
        const query = ref({})
        const spaces = scope.run(() => useChildCareSpaces(query, { skipWatchIf: () => skip.value }))
        if (spaces === undefined) throw new Error("The test scope must be active")

        // Act
        skip.value = true
        await nextTick()

        // Assert
        expect(spaces.isLoading.value).toEqual(false)
      })

      test("when the consuming scope stops, aborts the pending HTTP request", ({
        onTestFinished,
      }) => {
        // Arrange
        const pending = Promise.withResolvers<ListResponse>()
        let signal: GenericAbortSignal | undefined
        vi.mocked(httpClient, true).get.mockImplementationOnce((_url, options) => {
          signal = options?.signal
          return pending.promise
        })
        const scope = effectScope()
        onTestFinished(() => scope.stop())
        scope.run(() => useChildCareSpaces())

        // Act
        scope.stop()

        // Assert
        expect(signal?.aborted).toEqual(true)
      })
    })
  })
})
