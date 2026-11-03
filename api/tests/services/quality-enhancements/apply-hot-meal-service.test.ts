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

      test("when a later monthly update fails, rejects the hot-meal application", async () => {
        // Arrange
        vi.useFakeTimers({ toFake: ["Date"] })
        vi.setSystemTime(new Date("2026-10-20T12:00:00Z"))

        const fundingRegion = await fundingRegionFactory.create({
          hotMealIncrementAmount: "32.0600",
        })
        const centre = await centreFactory.create({ fundingRegionId: fundingRegion.id })
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2026-2027" })
        const fiscalPeriod = await fiscalPeriodFactory.associations({ fundingPeriod }).create({
          dateStart: new Date("2027-01-01T00:00:00Z"),
          dateEnd: new Date("2027-01-31T23:59:59Z"),
        })
        const firstCategory = await qualityEnhancementCategoryFactory
          .associations({ fundingPeriod })
          .create({ categoryName: "Infants" })
        const secondCategory = await qualityEnhancementCategoryFactory
          .associations({ fundingPeriod })
          .create({ categoryName: "Preschool" })
        await qualityEnhancementFactory
          .associations({ centre, fiscalPeriod, category: firstCategory })
          .create({ baseMonthlyAmount: "100.0000" })
        await qualityEnhancementFactory
          .associations({ centre, fiscalPeriod, category: secondCategory })
          .create({ baseMonthlyAmount: "200.0000" })
        const update = QualityEnhancement.prototype.update
        vi.spyOn(QualityEnhancement.prototype, "update")
          .mockImplementationOnce(update)
          .mockRejectedValueOnce(new Error("Later monthly write failed"))

        // Act & Assert
        await expect(ApplyHotMealService.perform(centre)).rejects.toThrow(
          "Later monthly write failed"
        )
      })

      test("when a later monthly update fails, rolls back every hot-meal amount", async () => {
        // Arrange
        vi.useFakeTimers({ toFake: ["Date"] })
        vi.setSystemTime(new Date("2026-10-20T12:00:00Z"))

        const fundingRegion = await fundingRegionFactory.create({
          hotMealIncrementAmount: "32.0600",
        })
        const centre = await centreFactory.create({ fundingRegionId: fundingRegion.id })
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2026-2027" })
        const fiscalPeriod = await fiscalPeriodFactory.associations({ fundingPeriod }).create({
          dateStart: new Date("2027-01-01T00:00:00Z"),
          dateEnd: new Date("2027-01-31T23:59:59Z"),
        })
        const firstCategory = await qualityEnhancementCategoryFactory
          .associations({ fundingPeriod })
          .create({ categoryName: "Infants" })
        const secondCategory = await qualityEnhancementCategoryFactory
          .associations({ fundingPeriod })
          .create({ categoryName: "Preschool" })
        const first = await qualityEnhancementFactory
          .associations({ centre, fiscalPeriod, category: firstCategory })
          .create({ baseMonthlyAmount: "100.0000" })
        const second = await qualityEnhancementFactory
          .associations({ centre, fiscalPeriod, category: secondCategory })
          .create({ baseMonthlyAmount: "200.0000" })
        const update = QualityEnhancement.prototype.update
        vi.spyOn(QualityEnhancement.prototype, "update")
          .mockImplementationOnce(update)
          .mockRejectedValueOnce(new Error("Later monthly write failed"))

        // Act
        await ApplyHotMealService.perform(centre).catch(() => undefined)

        // Assert
        const enhancements = await QualityEnhancement.findAll({ order: [["id", "ASC"]] })
        expect(enhancements).toEqual([
          expect.objectContaining({
            id: first.id,
            hotMealIncrementAmount: "0",
            hotMealAppliedAt: null,
            monthlyAmount: "100",
          }),
          expect.objectContaining({
            id: second.id,
            hotMealIncrementAmount: "0",
            hotMealAppliedAt: null,
            monthlyAmount: "200",
          }),
        ])
      })
    })
  })
})
