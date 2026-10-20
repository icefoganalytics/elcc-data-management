import { administrationCostFactory } from "@/factories"

describe("api/src/models/administration-cost.ts", () => {
  describe("AdministrationCost", () => {
    describe("beforeSave", () => {
      test("when occupancy rates are saved, computes totals using exact decimal arithmetic", async () => {
        // Arrange
        const administrationCost = await administrationCostFactory.create({
          monthlyAmount: "10.0000",
          estimatedChildOccupancyRate: "0.1234",
          actualChildOccupancyRate: "0.4000",
        })

        // Act
        await administrationCost.reload()

        // Assert
        expect(administrationCost).toEqual(
          expect.objectContaining({
            estimatedComputedTotal: "1.234",
            actualComputedTotal: "4",
          })
        )
      })

      test("when estimated occupancy exceeds four decimal places, rejects the update", async () => {
        // Arrange
        const administrationCost = await administrationCostFactory.create()

        // Act
        const updatePromise = administrationCost.update({
          estimatedChildOccupancyRate: "0.12345",
        })

        // Assert
        await expect(updatePromise).rejects.toThrow("at most four decimal places")
      })

      test("when actual occupancy exceeds four decimal places, rejects the update", async () => {
        // Arrange
        const administrationCost = await administrationCostFactory.create()

        // Act
        const updatePromise = administrationCost.update({
          actualChildOccupancyRate: "0.12345",
        })

        // Assert
        await expect(updatePromise).rejects.toThrow("at most four decimal places")
      })

      test("when monthly amount exceeds four decimal places, rejects the update", async () => {
        // Arrange
        const administrationCost = await administrationCostFactory.create()

        // Act
        const updatePromise = administrationCost.update({ monthlyAmount: "10.00001" })

        // Assert
        await expect(updatePromise).rejects.toThrow("at most four decimal places")
      })
    })
  })
})
