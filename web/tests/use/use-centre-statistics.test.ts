import { onTestFinished } from "vitest"
import { effectScope } from "vue"

import { MAX_PER_PAGE } from "@/api/base-api"
import type { CentreAsIndex } from "@/api/centres-api"
import ApiOperationError from "@/api/errors/api-operation-error"
import httpClient from "@/api/http-client"
import useCentreStatistics from "@/use/use-centre-statistics"

import { mockHttpGetRoutes } from "@/tests/support"

function createStatistics(onTestFinished: (cleanup: () => void) => void) {
  const scope = effectScope()
  onTestFinished(() => scope.stop())
  const statistics = scope.run(() => useCentreStatistics({ skipWatchIf: () => true }))
  if (!statistics) throw new Error("Expected an active statistics scope")

  return statistics
}

describe("web/src/use/use-centre-statistics.ts", () => {
  describe("useCentreStatistics", () => {
    describe("fetch", () => {
      test.each([
        { count: "centreCount" as const, expected: MAX_PER_PAGE + 2 },
        { count: "communityCount" as const, expected: 3 },
      ])("when centres span pages, calculates the complete $count", async ({ count, expected }) => {
        // Arrange
        const centre: CentreAsIndex = {
          id: 1,
          fundingRegionId: 1,
          name: "Child Care Centre",
          license: null,
          community: "Whitehorse",
          isFirstNationProgram: false,
          status: "Inactive",
          hotMeal: null,
          licensedFor: null,
          buildingUsagePercent: "100.0000",
          lastSubmission: null,
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        }
        const firstPage = Array.from({ length: MAX_PER_PAGE }, (_, index) => ({
          ...centre,
          id: index + 1,
          community: index % 2 === 0 ? "Whitehorse" : "Dawson City",
        }))
        const secondPage = [
          { ...centre, id: MAX_PER_PAGE + 1, community: "Dawson City" },
          { ...centre, id: MAX_PER_PAGE + 2, community: "Watson Lake" },
        ]
        mockHttpGetRoutes({
          "/api/centres": (config) => ({
            data: {
              centres: config?.params?.page === 1 ? firstPage : secondPage,
              totalCount: MAX_PER_PAGE + 2,
            },
          }),
        })
        const { statistics, fetch } = createStatistics(onTestFinished)

        // Act
        await fetch()

        // Assert
        expect(statistics.value?.[count]).toEqual(expected)
      })

      test("when no authorized centres exist, publishes real zero counts", async ({
        onTestFinished,
      }) => {
        // Arrange
        vi.mocked(httpClient, true).get.mockResolvedValueOnce({
          data: { centres: [], totalCount: 0 },
        })
        const { statistics, fetch } = createStatistics(onTestFinished)

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
          data: { centres: [], totalCount: 0 },
        })
        const { statistics, fetch } = createStatistics(onTestFinished)
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
        const { isErrored, fetch } = createStatistics(onTestFinished)
        await fetch().catch(() => undefined)
        vi.mocked(httpClient, true).get.mockResolvedValueOnce({
          data: { centres: [], totalCount: 0 },
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
          data: { centres: [], totalCount: 0 },
        })
        const { isErrored, fetch } = createStatistics(onTestFinished)
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
