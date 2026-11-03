import { diverseNeedFactory } from "@/factories/diverse-need-factory"
import DiverseNeed from "@/models/diverse-need"

describe("api/src/models/diverse-need.ts", () => {
  describe("DiverseNeed", () => {
    describe("#update", () => {
      test("when occupancies change, calculates estimated and actual totals from the saved monthly snapshot", async () => {
        // Arrange
        const diverseNeed = await diverseNeedFactory.create({
          monthlyAmount: "54.9600",
          estimatedChildOccupancyRate: "0.3333",
          actualChildOccupancyRate: "0.2000",
        })

        // Act
        await diverseNeed.update({
          estimatedChildOccupancyRate: "0.2500",
          actualChildOccupancyRate: "0.1250",
        })

        // Assert
        const persisted = await DiverseNeed.findByPk(diverseNeed.id)
        expect(persisted).toMatchObject({
          monthlyAmount: "54.96",
          estimatedChildOccupancyRate: "0.25",
          actualChildOccupancyRate: "0.125",
          estimatedComputedTotal: "13.74",
          actualComputedTotal: "6.87",
        })
      })

      test("when occupancy exceeds four decimal places, rejects the value", async () => {
        // Arrange
        const diverseNeed = await diverseNeedFactory.create()

        // Act / Assert
        await expect(
          diverseNeed.update({ estimatedChildOccupancyRate: "0.12345" })
        ).rejects.toThrow("at most four decimal places")
      })
    })
  })
})
