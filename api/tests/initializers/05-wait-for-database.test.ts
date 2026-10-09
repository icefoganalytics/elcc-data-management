import { waitForDatabase } from "@/initializers/05-wait-for-database"

vi.hoisted(() => {
  vi.resetModules()
})

vi.mock("knex", () => ({
  default: vi.fn(() => ({
    raw: vi.fn().mockResolvedValue([]),
    destroy: vi.fn().mockResolvedValue(undefined),
  })),
}))

vi.mock("@/db/db-migration-client", () => ({
  buildKnexConfig: () => ({ client: "mssql" }),
}))

describe("api/src/initializers/05-wait-for-database.ts", () => {
  describe("waitForDatabase", () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.clearAllTimers()
      vi.useRealTimers()
    })

    test("when the database is ready, completes after one configured startup grace period", async () => {
      // Arrange
      const startPeriodSeconds = 1
      let readinessState = "waiting"
      void waitForDatabase({
        startPeriodSeconds,
        intervalSeconds: 1,
        timeoutSeconds: 60,
        retries: 1,
      }).then(() => {
        readinessState = "ready"
      })

      // Act
      await vi.advanceTimersByTimeAsync(startPeriodSeconds * 1000)

      // Assert
      expect(readinessState).toEqual("ready")
    })
  })
})
