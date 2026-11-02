import {
  centreFactory,
  fiscalPeriodFactory,
  fundingPeriodFactory,
  fundingRegionFactory,
  qualityEnhancementCategoryFactory,
  qualityEnhancementFactory,
} from "@/factories"
import QualityEnhancement from "@/models/quality-enhancement"
import CreateService from "@/services/quality-enhancements/create-service"

describe("api/src/services/quality-enhancements/create-service.ts", () => {
  describe("CreateService", () => {
    describe("#perform", () => {
      test("when creating forward, derives snapshots without changing existing rows", async () => {
        // Arrange
        const centre = await centreFactory.create({ hotMeal: false })
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2026-2027" })
        const currentPeriod = await fiscalPeriodFactory.associations({ fundingPeriod }).create({
          dateStart: new Date("2026-10-01T00:00:00.000Z"),
        })
        const futurePeriod = await fiscalPeriodFactory.associations({ fundingPeriod }).create({
          dateStart: new Date("2026-11-01T00:00:00.000Z"),
        })
        const category = await qualityEnhancementCategoryFactory
          .associations({ fundingPeriod })
          .create({ categoryName: "Infants", monthlyAmount: "206.1000" })
        const existingFuture = await qualityEnhancementFactory
          .associations({ centre, fiscalPeriod: futurePeriod, category })
          .create({ estimatedChildOccupancyRate: "0.3000", actualChildOccupancyRate: "0.2000" })

        // Act
        const enhancement = await CreateService.perform({
          centreId: centre.id,
          fiscalPeriodId: currentPeriod.id,
          categoryId: category.id,
          estimatedChildOccupancyRate: "0.5000",
          actualChildOccupancyRate: "0.2500",
          applyToCurrentAndFutureFiscalPeriods: true,
        })

        // Assert
        const enhancements = await QualityEnhancement.findAll({
          where: { centreId: centre.id, categoryId: category.id },
          order: [["fiscalPeriodId", "ASC"]],
        })
        expect(enhancements).toEqual([
          expect.objectContaining({
            id: enhancement.id,
            fiscalPeriodId: currentPeriod.id,
            lineName: "Infants",
            baseMonthlyAmount: "206.1",
            hotMealIncrementAmount: "0",
            monthlyAmount: "206.1",
            estimatedChildOccupancyRate: "0.5",
            actualChildOccupancyRate: "0.25",
            estimatedComputedTotal: "103.05",
            actualComputedTotal: "51.525",
          }),
          expect.objectContaining({
            id: existingFuture.id,
            fiscalPeriodId: futurePeriod.id,
            estimatedChildOccupancyRate: "0.3",
            actualChildOccupancyRate: "0.2",
          }),
        ])
      })

      test("when a category belongs to another funding period, rejects creation", async () => {
        // Arrange
        const centre = await centreFactory.create()
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2026-2027" })
        const fiscalPeriod = await fiscalPeriodFactory.associations({ fundingPeriod }).create()
        const otherFundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2027-2028" })
        const category = await qualityEnhancementCategoryFactory
          .associations({ fundingPeriod: otherFundingPeriod })
          .create()

        // Act & Assert
        await expect(
          CreateService.perform({
            centreId: centre.id,
            fiscalPeriodId: fiscalPeriod.id,
            categoryId: category.id,
            estimatedChildOccupancyRate: "0.5000",
            actualChildOccupancyRate: "0.2500",
          })
        ).rejects.toThrow(
          "Quality Enhancement category does not belong to the fiscal period funding period"
        )
      })

      test("when the centre and month already have an active category row, rejects duplication", async () => {
        // Arrange
        const centre = await centreFactory.create()
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2026-2027" })
        const fiscalPeriod = await fiscalPeriodFactory.associations({ fundingPeriod }).create()
        const category = await qualityEnhancementCategoryFactory
          .associations({ fundingPeriod })
          .create()
        await qualityEnhancementFactory.associations({ centre, fiscalPeriod, category }).create()

        // Act & Assert
        await expect(
          CreateService.perform({
            centreId: centre.id,
            fiscalPeriodId: fiscalPeriod.id,
            categoryId: category.id,
            estimatedChildOccupancyRate: "0.5000",
            actualChildOccupancyRate: "0.2500",
          })
        ).rejects.toThrow(
          "Quality Enhancement already exists for this centre, fiscal period, and category"
        )
      })

      test("when explicitly adding a retired category back, creates a new snapshot and preserves retired history", async () => {
        // Arrange
        const centre = await centreFactory.create()
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2026-2027" })
        const fiscalPeriod = await fiscalPeriodFactory.associations({ fundingPeriod }).create()
        const category = await qualityEnhancementCategoryFactory
          .associations({ fundingPeriod })
          .create()
        const retired = await qualityEnhancementFactory
          .associations({ centre, fiscalPeriod, category })
          .create()
        await retired.destroy()

        // Act
        await CreateService.perform({
          centreId: centre.id,
          fiscalPeriodId: fiscalPeriod.id,
          categoryId: category.id,
          estimatedChildOccupancyRate: "0.5000",
          actualChildOccupancyRate: "0.2500",
        })

        // Assert
        const enhancements = await QualityEnhancement.findAll({
          where: { centreId: centre.id, fiscalPeriodId: fiscalPeriod.id, categoryId: category.id },
          paranoid: false,
          order: [["id", "ASC"]],
        })
        expect(enhancements).toEqual([
          expect.objectContaining({ id: retired.id, deletedAt: expect.any(Date) }),
          expect.objectContaining({
            deletedAt: null,
            estimatedChildOccupancyRate: "0.5",
            actualChildOccupancyRate: "0.25",
          }),
        ])
      })

      test("when a hot-meal centre creates forward, copies occupancy and regional snapshots to new rows", async () => {
        // Arrange
        const fundingRegion = await fundingRegionFactory.create({
          hotMealIncrementAmount: "32.0600",
        })
        const centre = await centreFactory.associations({ fundingRegion }).create({ hotMeal: true })
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2026-2027" })
        const currentPeriod = await fiscalPeriodFactory.associations({ fundingPeriod }).create({
          dateStart: new Date("2026-10-01T00:00:00.000Z"),
        })
        const futurePeriod = await fiscalPeriodFactory.associations({ fundingPeriod }).create({
          dateStart: new Date("2026-11-01T00:00:00.000Z"),
        })
        const category = await qualityEnhancementCategoryFactory
          .associations({ fundingPeriod })
          .create({ monthlyAmount: "206.1000" })

        // Act
        await CreateService.perform({
          centreId: centre.id,
          fiscalPeriodId: currentPeriod.id,
          categoryId: category.id,
          estimatedChildOccupancyRate: "0.5000",
          actualChildOccupancyRate: "0.2500",
          applyToCurrentAndFutureFiscalPeriods: true,
        })

        // Assert
        expect(
          await QualityEnhancement.findOne({
            where: {
              centreId: centre.id,
              fiscalPeriodId: futurePeriod.id,
              categoryId: category.id,
            },
          })
        ).toEqual(
          expect.objectContaining({
            childCareSpaceCategoryId: category.childCareSpaceCategoryId,
            lineName: category.categoryName,
            baseMonthlyAmount: "206.1",
            hotMealIncrementAmount: "32.06",
            monthlyAmount: "238.16",
            estimatedChildOccupancyRate: "0.5",
            actualChildOccupancyRate: "0.25",
            estimatedComputedTotal: "119.08",
            actualComputedTotal: "59.54",
          })
        )
      })
    })
  })
})
