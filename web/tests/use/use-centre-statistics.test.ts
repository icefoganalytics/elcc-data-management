import { onTestFinished } from "vitest"
import { effectScope } from "vue"

import ApiOperationError from "@/api/errors/api-operation-error"
import httpClient from "@/api/http-client"
import useCentreStatistics from "@/use/use-centre-statistics"

describe("web/src/use/use-centre-statistics.ts", () => {
  describe("useCentreStatistics", () => {
    describe("fetch", () => {
      test("when the response is paginated, uses the full centre total", async () => {
        // Arrange
        vi.mocked(httpClient, true).get.mockResolvedValueOnce({
          data: { centres: [], totalCount: 1002, summaries: { communityCount: 3 } },
        })
        const scope = effectScope()
        onTestFinished(() => scope.stop())
        const result = scope.run(() => useCentreStatistics({ skipWatchIf: () => true }))
        if (!result) throw new Error("Expected an active statistics scope")
        const { statistics, fetch } = result

        // Act
        await fetch()

        // Assert
        expect(statistics.value?.centreCount).toEqual(1002)
      })

      test("when the response is paginated, uses the full community summary", async () => {
        // Arrange
        vi.mocked(httpClient, true).get.mockResolvedValueOnce({
          data: { centres: [], totalCount: 1002, summaries: { communityCount: 3 } },
        })
        const scope = effectScope()
        onTestFinished(() => scope.stop())
        const result = scope.run(() => useCentreStatistics({ skipWatchIf: () => true }))
        if (!result) throw new Error("Expected an active statistics scope")
        const { statistics, fetch } = result

        // Act
        await fetch()

        // Assert
        expect(statistics.value?.communityCount).toEqual(3)
      })

      test("when no authorized centres exist, publishes real zero counts", async ({
        onTestFinished,
      }) => {
        // Arrange
        vi.mocked(httpClient, true).get.mockResolvedValueOnce({
          data: { centres: [], totalCount: 0, summaries: { communityCount: 0 } },
        })
        const scope = effectScope()
        onTestFinished(() => scope.stop())
        const result = scope.run(() => useCentreStatistics({ skipWatchIf: () => true }))
        if (!result) throw new Error("Expected an active statistics scope")
        const { statistics, fetch } = result

        // Act
        await fetch()

        // Assert
        expect(statistics.value).toEqual({ centreCount: 0, communityCount: 0 })
      })

      test("when a refresh fails after success, clears the previous statistics", async ({
        onTestFinished,
      }) => {
        // Arrange
        vi.mocked(httpClient, true).get.mockResolvedValueOnce({
          data: { centres: [], totalCount: 0, summaries: { communityCount: 0 } },
        })
        const scope = effectScope()
        onTestFinished(() => scope.stop())
        const result = scope.run(() => useCentreStatistics({ skipWatchIf: () => true }))
        if (!result) throw new Error("Expected an active statistics scope")
        const { statistics, fetch } = result
        await fetch()
        vi.mocked(httpClient, true).get.mockRejectedValueOnce(
          new ApiOperationError("Unavailable", 503)
        )

        // Act
        await fetch().catch(() => undefined)

        // Assert
        expect(statistics.value).toBeNull()
      })

      test("when a request succeeds after failure, clears the error state", async ({
        onTestFinished,
      }) => {
        // Arrange
        vi.mocked(httpClient, true).get.mockRejectedValueOnce(
          new ApiOperationError("Unavailable", 503)
        )
        const scope = effectScope()
        onTestFinished(() => scope.stop())
        const result = scope.run(() => useCentreStatistics({ skipWatchIf: () => true }))
        if (!result) throw new Error("Expected an active statistics scope")
        const { isErrored, fetch } = result
        await fetch().catch(() => undefined)
        vi.mocked(httpClient, true).get.mockResolvedValueOnce({
          data: { centres: [], totalCount: 0, summaries: { communityCount: 0 } },
        })

        // Act
        await fetch()

        // Assert
        expect(isErrored.value).toEqual(false)
      })

      test("when an obsolete request fails, does not mark the replacement request errored", async ({
        onTestFinished,
      }) => {
        // Arrange
        const pending = Promise.withResolvers<never>()
        vi.mocked(httpClient, true).get.mockReturnValueOnce(pending.promise)
        vi.mocked(httpClient, true).get.mockResolvedValueOnce({
          data: { centres: [], totalCount: 0, summaries: { communityCount: 0 } },
        })
        const scope = effectScope()
        onTestFinished(() => scope.stop())
        const result = scope.run(() => useCentreStatistics({ skipWatchIf: () => true }))
        if (!result) throw new Error("Expected an active statistics scope")
        const { isErrored, fetch } = result
        const previousFetch = fetch()
        await fetch()

        // Act
        pending.reject(new ApiOperationError("Obsolete failure", 503))
        await previousFetch

        // Assert
        expect(isErrored.value).toEqual(false)
      })
    })
  })
})
