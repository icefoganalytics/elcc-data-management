import httpClient from "@/api/http-client"

import { mockHttpGetRoutes } from "@/tests/support"

describe("web/tests/support/mock-http-client.ts", () => {
  describe("mockHttpGetRoutes", () => {
    describe("GET route dispatch", () => {
      test("when a URL only shares a registered prefix, preserves the previous response", async () => {
        // Arrange
        const fallbackResponse = { data: { record: { id: 1 } } }
        vi.mocked(httpClient.get).mockResolvedValue(fallbackResponse)
        mockHttpGetRoutes({
          "/api/records": () => ({ data: { records: [] } }),
        })

        // Act
        const result = await httpClient.get("/api/records/1")

        // Assert
        expect(result).toBe(fallbackResponse)
      })

      test("when a callback rejects, propagates the original failure", async () => {
        // Arrange
        const error = new Error("Records are unavailable")
        mockHttpGetRoutes({
          "/api/records": () => Promise.reject(error),
        })

        // Act
        const request = httpClient.get("/api/records")

        // Assert
        await expect(request).rejects.toBe(error)
      })
    })
  })
})
