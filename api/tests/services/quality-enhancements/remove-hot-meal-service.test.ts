import {
  centreFactory,
  fiscalPeriodFactory,
  fundingPeriodFactory,
  qualityEnhancementCategoryFactory,
  qualityEnhancementFactory,
} from "@/factories"
import QualityEnhancement from "@/models/quality-enhancement"
import RemoveHotMealService from "@/services/quality-enhancements/remove-hot-meal-service"

describe("api/src/services/quality-enhancements/remove-hot-meal-service.ts", () => {
  describe("RemoveHotMealService", () => {
    describe("#perform", () => {
      afterEach(() => {
        vi.useRealTimers()
      })

      test("when removing hot meals, restores future base amounts without rewriting past months", async () => {
        // Arrange
        vi.useFakeTimers({ toFake: ["Date"] })
        vi.setSystemTime(new Date("2026-10-20T12:00:00Z"))
        const centre = await centreFactory.create()
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2026-2027" })
        const pastPeriod = await fiscalPeriodFactory.associations({ fundingPeriod }).create({
          fiscalYear: "2026-27",
          dateStart: new Date("2026-09-01T00:00:00Z"),
          dateEnd: new Date("2026-09-30T23:59:59Z"),
        })
        const futurePeriod = await fiscalPeriodFactory.associations({ fundingPeriod }).create({
          fiscalYear: "2026-27",
          dateStart: new Date("2026-11-01T00:00:00Z"),
          dateEnd: new Date("2026-11-30T23:59:59Z"),
        })
        const category = await qualityEnhancementCategoryFactory
          .associations({ fundingPeriod })
          .create()
        const past = await qualityEnhancementFactory
          .associations({ centre, fiscalPeriod: pastPeriod, category })
          .create({
            baseMonthlyAmount: "100.0000",
            hotMealIncrementAmount: "32.0600",
            estimatedChildOccupancyRate: "0.5000",
          })
        const future = await qualityEnhancementFactory
          .associations({ centre, fiscalPeriod: futurePeriod, category })
          .create({
            baseMonthlyAmount: "100.0000",
            hotMealIncrementAmount: "32.0600",
            estimatedChildOccupancyRate: "0.5000",
          })

        // Act
        await RemoveHotMealService.perform(centre)

        // Assert
        const enhancements = await QualityEnhancement.findAll({ order: [["id", "ASC"]] })
        expect(enhancements).toEqual([
          expect.objectContaining({
            id: past.id,
            hotMealIncrementAmount: "32.06",
            monthlyAmount: "132.06",
            estimatedComputedTotal: "66.03",
          }),
          expect.objectContaining({
            id: future.id,
            hotMealIncrementAmount: "0",
            monthlyAmount: "100",
            estimatedComputedTotal: "50",
            hotMealAppliedAt: null,
          }),
        ])
      })

      test("when a later monthly update fails, retains every previous hot-meal amount", async () => {
        // Arrange
        vi.useFakeTimers({ toFake: ["Date"] })
        vi.setSystemTime(new Date("2026-10-20T12:00:00Z"))
        const centre = await centreFactory.create()
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
        const appliedAt = new Date("2026-10-20T00:00:00Z")
        const first = await qualityEnhancementFactory
          .associations({ centre, fiscalPeriod, category: firstCategory })
          .create({
            baseMonthlyAmount: "100.0000",
            hotMealIncrementAmount: "32.0600",
            hotMealAppliedAt: appliedAt,
          })
        const second = await qualityEnhancementFactory
          .associations({ centre, fiscalPeriod, category: secondCategory })
          .create({
            baseMonthlyAmount: "200.0000",
            hotMealIncrementAmount: "32.0600",
            hotMealAppliedAt: appliedAt,
          })
        const update = QualityEnhancement.prototype.update
        vi.spyOn(QualityEnhancement.prototype, "update")
          .mockImplementationOnce(update)
          .mockRejectedValueOnce(new Error("Later monthly write failed"))

        // Act & Assert
        await expect(RemoveHotMealService.perform(centre)).rejects.toThrow(
          "Later monthly write failed"
        )
        const enhancements = await QualityEnhancement.findAll({ order: [["id", "ASC"]] })
        expect(enhancements).toEqual([
          expect.objectContaining({
            id: first.id,
            hotMealIncrementAmount: "32.06",
            hotMealAppliedAt: appliedAt,
            monthlyAmount: "132.06",
          }),
          expect.objectContaining({
            id: second.id,
            hotMealIncrementAmount: "32.06",
            hotMealAppliedAt: appliedAt,
            monthlyAmount: "232.06",
          }),
        ])
      })
    })
  })
})
