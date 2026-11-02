import QualityEnhancement from "@/models/quality-enhancement"

import {
  childCareSpaceCategoryFactory,
  centreFactory,
  fiscalPeriodFactory,
  fundingPeriodFactory,
  qualityEnhancementCategoryFactory,
  qualityEnhancementFactory,
} from "@/factories"
import ReplicateEstimatesService from "@/services/quality-enhancements/replicate-estimates-service"

describe("api/src/services/quality-enhancements/replicate-estimates-service.ts", () => {
  describe("ReplicateEstimatesService", () => {
    describe("#perform", () => {
      test("when a later month is absent, updates a subsequent active row without repricing", async () => {
        // Arrange
        const centre = await centreFactory.create()
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2025-2026" })
        const sourcePeriod = await fiscalPeriodFactory.associations({ fundingPeriod }).create({
          fiscalYear: "2025-26",
          dateStart: new Date("2025-04-01T00:00:00.000Z"),
          dateEnd: new Date("2025-04-30T23:59:59.000Z"),
        })
        await fiscalPeriodFactory.associations({ fundingPeriod }).create({
          fiscalYear: "2025-26",
          dateStart: new Date("2025-05-01T00:00:00.000Z"),
          dateEnd: new Date("2025-05-31T23:59:59.000Z"),
        })
        const targetPeriod = await fiscalPeriodFactory.associations({ fundingPeriod }).create({
          fiscalYear: "2025-26",
          dateStart: new Date("2025-06-01T00:00:00.000Z"),
          dateEnd: new Date("2025-06-30T23:59:59.000Z"),
        })
        const category = await qualityEnhancementCategoryFactory
          .associations({ fundingPeriod })
          .create()
        const spaceCategory = await childCareSpaceCategoryFactory
          .associations({ fundingPeriod })
          .create()
        await category.update({ childCareSpaceCategoryId: spaceCategory.id })
        const source = await qualityEnhancementFactory
          .associations({ centre, fiscalPeriod: sourcePeriod, category })
          .create({
            estimatedChildOccupancyRate: "0.6250",
            actualChildOccupancyRate: "0.4000",
          })
        const target = await qualityEnhancementFactory
          .associations({ centre, fiscalPeriod: targetPeriod, category })
          .create({
            baseMonthlyAmount: "150.0000",
            hotMealIncrementAmount: "32.0600",
            hotMealAppliedAt: new Date("2025-06-01T00:00:00.000Z"),
            childCareSpaceCategoryId: spaceCategory.id,
            estimatedChildOccupancyRate: "0.1000",
            actualChildOccupancyRate: "0.8000",
          })

        // Act
        await ReplicateEstimatesService.perform(source)

        // Assert
        await target.reload()
        expect(target).toMatchObject({
          estimatedChildOccupancyRate: "0.625",
          actualChildOccupancyRate: "0",
          baseMonthlyAmount: "150",
          hotMealAppliedAt: new Date("2025-06-01T00:00:00.000Z"),
          hotMealIncrementAmount: "32.06",
          monthlyAmount: "182.06",
          childCareSpaceCategoryId: spaceCategory.id,
        })
      })

      test("when a later month is absent, preserves the gap during estimate replication", async () => {
        // Arrange
        const centre = await centreFactory.create()
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2025-2026" })
        const sourcePeriod = await fiscalPeriodFactory.associations({ fundingPeriod }).create({
          dateStart: new Date("2025-04-01T00:00:00Z"),
        })
        const missingPeriod = await fiscalPeriodFactory.associations({ fundingPeriod }).create({
          dateStart: new Date("2025-05-01T00:00:00Z"),
        })
        const targetPeriod = await fiscalPeriodFactory.associations({ fundingPeriod }).create({
          dateStart: new Date("2025-06-01T00:00:00Z"),
        })
        const category = await qualityEnhancementCategoryFactory
          .associations({ fundingPeriod })
          .create()
        const source = await qualityEnhancementFactory
          .associations({ centre, fiscalPeriod: sourcePeriod, category })
          .create({ estimatedChildOccupancyRate: "0.6250" })
        await qualityEnhancementFactory
          .associations({ centre, fiscalPeriod: targetPeriod, category })
          .create()

        // Act
        await ReplicateEstimatesService.perform(source)

        // Assert
        expect(
          await QualityEnhancement.findOne({
            where: {
              centreId: centre.id,
              fiscalPeriodId: missingPeriod.id,
              categoryId: category.id,
            },
          })
        ).toBeNull()
      })
    })
  })
})
