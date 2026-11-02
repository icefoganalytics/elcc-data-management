import {
  centreFactory,
  fiscalPeriodFactory,
  fundingPeriodFactory,
  fundingRegionFactory,
  qualityEnhancementCategoryFactory,
  qualityEnhancementFactory,
} from "@/factories"
import QualityEnhancement from "@/models/quality-enhancement"
import ApplyHotMealService from "@/services/quality-enhancements/apply-hot-meal-service"

describe("api/src/services/quality-enhancements/apply-hot-meal-service.ts", () => {
  describe("ApplyHotMealService", () => {
    describe("#perform", () => {
      afterEach(() => {
        vi.useRealTimers()
      })

      test("when applying hot meals repeatedly, updates current and future months only once", async () => {
        // Arrange
        vi.useFakeTimers({ toFake: ["Date"] })
        vi.setSystemTime(new Date("2026-10-20T12:00:00Z"))
        const fundingRegion = await fundingRegionFactory.create({
          hotMealIncrementAmount: "32.0600",
        })
        const centre = await centreFactory.create({
          fundingRegionId: fundingRegion.id,
          hotMeal: true,
        })
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2026-2027" })
        const pastPeriod = await fiscalPeriodFactory.associations({ fundingPeriod }).create({
          fiscalYear: "2026-27",
          dateStart: new Date("2026-04-01T00:00:00Z"),
          dateEnd: new Date("2026-04-30T23:59:59Z"),
        })
        const currentPeriod = await fiscalPeriodFactory.associations({ fundingPeriod }).create({
          fiscalYear: "2026-27",
          dateStart: new Date("2026-10-01T00:00:00Z"),
          dateEnd: new Date("2026-10-31T23:59:59Z"),
        })
        const futurePeriod = await fiscalPeriodFactory.associations({ fundingPeriod }).create({
          fiscalYear: "2026-27",
          dateStart: new Date("2027-01-01T00:00:00Z"),
          dateEnd: new Date("2027-01-31T23:59:59Z"),
        })
        const category = await qualityEnhancementCategoryFactory
          .associations({ fundingPeriod })
          .create()
        const past = await qualityEnhancementFactory
          .associations({ centre, fiscalPeriod: pastPeriod, category })
          .create({
            baseMonthlyAmount: "100.0000",
            hotMealIncrementAmount: "5.0000",
            hotMealAppliedAt: new Date("2026-04-01T00:00:00Z"),
            estimatedChildOccupancyRate: "0.5000",
          })
        const current = await qualityEnhancementFactory
          .associations({ centre, fiscalPeriod: currentPeriod, category })
          .create({
            baseMonthlyAmount: "100.0000",
            estimatedChildOccupancyRate: "0.5000",
          })
        const future = await qualityEnhancementFactory
          .associations({ centre, fiscalPeriod: futurePeriod, category })
          .create({
            baseMonthlyAmount: "100.0000",
            estimatedChildOccupancyRate: "0.2500",
          })

        // Act
        await ApplyHotMealService.perform(centre)
        await ApplyHotMealService.perform(centre)

        // Assert
        const enhancements = await QualityEnhancement.findAll({ order: [["id", "ASC"]] })
        expect(enhancements).toEqual([
          expect.objectContaining({
            id: past.id,
            hotMealIncrementAmount: "5",
            monthlyAmount: "105",
            estimatedComputedTotal: "52.5",
          }),
          expect.objectContaining({
            id: current.id,
            hotMealIncrementAmount: "32.06",
            monthlyAmount: "132.06",
            estimatedComputedTotal: "66.03",
          }),
          expect.objectContaining({
            id: future.id,
            hotMealIncrementAmount: "32.06",
            monthlyAmount: "132.06",
            estimatedComputedTotal: "33.015",
          }),
        ])
      })
    })
  })
})
