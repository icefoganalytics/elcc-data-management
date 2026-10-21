import { qualityEnhancementFactory } from "@/factories/quality-enhancement-factory"
import QualityEnhancement from "@/models/quality-enhancement"

describe("api/src/models/quality-enhancement.ts", () => {
  test("when monthly occupancy is saved, calculates totals from base and hot meal snapshots", async () => {
    // Arrange
    const enhancement = await qualityEnhancementFactory.create({
      baseMonthlyAmount: "206.1000",
      hotMealIncrementAmount: "25.2500",
      hotMealAppliedAt: new Date("2026-10-01T00:00:00.000Z"),
    })

    // Act
    await enhancement.update({
      estimatedChildOccupancyRate: "0.5000",
      actualChildOccupancyRate: "0.2500",
    })

    // Assert
    const persisted = await QualityEnhancement.findByPk(enhancement.id)
    expect(persisted).toMatchObject({
      baseMonthlyAmount: "206.1",
      hotMealIncrementAmount: "25.25",
      monthlyAmount: "231.35",
      estimatedComputedTotal: "115.675",
      actualComputedTotal: "57.8375",
    })
  })

  test("when occupancy exceeds four decimal places, rejects the value", async () => {
    // Arrange
    const enhancement = await qualityEnhancementFactory.create()

    // Act / Assert
    await expect(
      enhancement.update({
        estimatedChildOccupancyRate: "0.12345",
      })
    ).rejects.toThrow("at most four decimal places")
  })
})
