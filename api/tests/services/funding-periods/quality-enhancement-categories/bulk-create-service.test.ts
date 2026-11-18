import childCareCategoryFactory from "@/factories/child-care-category-factory"
import {
  childCareSpaceCategoryFactory,
  fundingPeriodFactory,
  qualityEnhancementCategoryFactory,
} from "@/factories"
import QualityEnhancementCategory from "@/models/quality-enhancement-category"
import BulkCreateService from "@/services/funding-periods/quality-enhancement-categories/bulk-create-service"

describe("api/src/services/funding-periods/quality-enhancement-categories/bulk-create-service.ts", () => {
  describe("BulkCreateService", () => {
    describe("#perform", () => {
      test("when cloning a funding period, preserves configuration and remaps the space link", async () => {
        // Arrange
        const previousFundingPeriod = await fundingPeriodFactory.create({
          fiscalYear: "2025-2026",
          fromDate: new Date("2025-04-01T00:00:00.000Z"),
        })
        const targetFundingPeriod = await fundingPeriodFactory.create({
          fiscalYear: "2026-2027",
          fromDate: new Date("2026-04-01T00:00:00.000Z"),
        })
        const previousSpaceCategoryChildCareCategory = await childCareCategoryFactory.create({
          fundingPeriodId: previousFundingPeriod.id,
          categoryName: "Infants",
        })
        const previousSpaceCategory = await childCareSpaceCategoryFactory
          .associations({ fundingPeriod: previousFundingPeriod })
          .create({
            childCareCategoryId: previousSpaceCategoryChildCareCategory.id,
          })
        const targetSpaceCategoryChildCareCategory = await childCareCategoryFactory.create({
          fundingPeriodId: targetFundingPeriod.id,
          categoryName: "Infants",
        })
        const targetSpaceCategory = await childCareSpaceCategoryFactory
          .associations({ fundingPeriod: targetFundingPeriod })
          .create({
            childCareCategoryId: targetSpaceCategoryChildCareCategory.id,
          })
        await qualityEnhancementCategoryFactory
          .associations({ fundingPeriod: previousFundingPeriod })
          .create({
            monthlyAmount: "206.1000",
            childCareCategoryId: previousSpaceCategory.childCareCategoryId,
          })

        // Act
        await BulkCreateService.perform(targetFundingPeriod)

        // Assert
        const persistedCategories = await QualityEnhancementCategory.findAll({
          where: { fundingPeriodId: targetFundingPeriod.id },
        })
        expect(persistedCategories).toEqual([
          expect.objectContaining({
            fundingPeriodId: targetFundingPeriod.id,
            categoryName: "Infants",
            fromAge: 0,
            toAge: 5,
            monthlyAmount: "206.1",
            childCareCategoryId: targetSpaceCategory.childCareCategoryId,
          }),
        ])
      })

      test("when the newest configuration was deliberately emptied, does not revive older categories", async () => {
        // Arrange
        const olderFundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2024-2025" })
        const latestFundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2025-2026" })
        const targetFundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2026-2027" })
        await qualityEnhancementCategoryFactory
          .associations({ fundingPeriod: olderFundingPeriod })
          .create()
        const retiredCategory = await qualityEnhancementCategoryFactory
          .associations({ fundingPeriod: latestFundingPeriod })
          .create()
        await retiredCategory.destroy()

        // Act
        await BulkCreateService.perform(targetFundingPeriod)

        // Assert
        const categories = await QualityEnhancementCategory.findAll({
          where: { fundingPeriodId: targetFundingPeriod.id },
        })
        expect(categories).toEqual([])
      })

      test("when a source space category was retired, remaps its explicit link to the active target category", async () => {
        // Arrange
        const previousFundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2025-2026" })
        const targetFundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2026-2027" })
        const previousSpaceCategoryChildCareCategory = await childCareCategoryFactory.create({
          fundingPeriodId: previousFundingPeriod.id,
          categoryName: "Infants",
        })
        const previousSpaceCategory = await childCareSpaceCategoryFactory
          .associations({ fundingPeriod: previousFundingPeriod })
          .create({
            childCareCategoryId: previousSpaceCategoryChildCareCategory.id,
          })
        const targetSpaceCategoryChildCareCategory = await childCareCategoryFactory.create({
          fundingPeriodId: targetFundingPeriod.id,
          categoryName: "Infants",
        })
        const targetSpaceCategory = await childCareSpaceCategoryFactory
          .associations({ fundingPeriod: targetFundingPeriod })
          .create({
            childCareCategoryId: targetSpaceCategoryChildCareCategory.id,
          })
        await qualityEnhancementCategoryFactory
          .associations({ fundingPeriod: previousFundingPeriod })
          .create({
            childCareCategoryId: previousSpaceCategory.childCareCategoryId,
          })
        await previousSpaceCategory.destroy()

        // Act
        await BulkCreateService.perform(targetFundingPeriod)

        // Assert
        const categories = await QualityEnhancementCategory.findAll({
          where: { fundingPeriodId: targetFundingPeriod.id },
        })
        expect(categories).toEqual([
          expect.objectContaining({
            childCareCategoryId: targetSpaceCategory.childCareCategoryId,
          }),
        ])
      })

      test("when creating an older missing funding period, clones the latest earlier configuration instead of future rates", async () => {
        // Arrange
        const earlierFundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2024-2025" })
        const targetFundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2025-2026" })
        const futureFundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2026-2027" })
        const configuredCategory3ChildCareCategory = await childCareCategoryFactory.create({
          fundingPeriodId: earlierFundingPeriod.id,
          categoryName: "Infants",
        })
        await qualityEnhancementCategoryFactory
          .associations({ fundingPeriod: earlierFundingPeriod })
          .create({
            monthlyAmount: "206.1000",
            childCareCategoryId: configuredCategory3ChildCareCategory.id,
          })
        const configuredCategory4ChildCareCategory = await childCareCategoryFactory.create({
          fundingPeriodId: futureFundingPeriod.id,
          categoryName: "Infants",
        })
        await qualityEnhancementCategoryFactory
          .associations({ fundingPeriod: futureFundingPeriod })
          .create({
            monthlyAmount: "300.0000",
            childCareCategoryId: configuredCategory4ChildCareCategory.id,
          })

        // Act
        await BulkCreateService.perform(targetFundingPeriod)

        // Assert
        const categories = await QualityEnhancementCategory.findAll({
          where: { fundingPeriodId: targetFundingPeriod.id },
        })
        expect(categories).toEqual([
          expect.objectContaining({
            categoryName: "Infants",
            monthlyAmount: "206.1",
          }),
        ])
      })

      test("clones a sparse older program identity absent from the newest shared catalogue", async () => {
        const olderFundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2024-2025" })
        const newerFundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2025-2026" })
        const targetFundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2026-2027" })
        const olderCategory = await childCareCategoryFactory.create({
          fundingPeriodId: olderFundingPeriod.id,
          categoryName: "Standalone cohort",
          fromAge: 4,
          toAge: 8,
        })
        await qualityEnhancementCategoryFactory.create({
          fundingPeriodId: olderFundingPeriod.id,
          childCareCategoryId: olderCategory.id,
          monthlyAmount: "75.5000",
        })
        await childCareCategoryFactory.create({
          fundingPeriodId: newerFundingPeriod.id,
          categoryName: "Newest catalogue only",
        })

        await BulkCreateService.perform(targetFundingPeriod)
        const categories = await QualityEnhancementCategory.findAll({
          where: { fundingPeriodId: targetFundingPeriod.id },
        })

        expect(categories).toEqual([
          expect.objectContaining({
            fundingPeriodId: targetFundingPeriod.id,
            categoryName: "Standalone cohort",
            fromAge: 4,
            toAge: 8,
            monthlyAmount: "75.5",
          }),
        ])
      })
      test("when the latest shared catalogue retired an older program category, does not revive its rate", async () => {
        // Arrange
        const olderFundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2024-2025" })
        const latestFundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2025-2026" })
        const targetFundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2026-2027" })
        const olderCategory = await childCareCategoryFactory.create({
          fundingPeriodId: olderFundingPeriod.id,
          categoryName: "Retired cohort",
        })
        await qualityEnhancementCategoryFactory.create({
          fundingPeriodId: olderFundingPeriod.id,
          childCareCategoryId: olderCategory.id,
          monthlyAmount: "42.1234",
        })
        const retiredCategory = await childCareCategoryFactory.create({
          fundingPeriodId: latestFundingPeriod.id,
          categoryName: "Retired cohort",
        })
        await retiredCategory.destroy()

        // Act
        const categories = await BulkCreateService.perform(targetFundingPeriod)

        // Assert
        expect(categories).toEqual([])
      })

      test("when an active replacement shares a retired category name, clones the rate to the active identity", async () => {
        // Arrange
        const previousFundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2025-2026" })
        const targetFundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2026-2027" })
        const sourceCategory = await childCareCategoryFactory.create({
          fundingPeriodId: previousFundingPeriod.id,
          categoryName: "Replacement cohort",
          fromAge: 5,
          toAge: 5,
        })
        await qualityEnhancementCategoryFactory.create({
          fundingPeriodId: previousFundingPeriod.id,
          childCareCategoryId: sourceCategory.id,
          monthlyAmount: "42.1234",
        })
        const retiredCategory = await childCareCategoryFactory.create({
          fundingPeriodId: targetFundingPeriod.id,
          categoryName: "Replacement cohort",
        })
        await retiredCategory.destroy()
        const activeCategory = await childCareCategoryFactory.create({
          fundingPeriodId: targetFundingPeriod.id,
          categoryName: "Replacement cohort",
          fromAge: 5,
          toAge: 5,
        })

        // Act
        const categories = await BulkCreateService.perform(targetFundingPeriod)

        // Assert
        expect(categories).toEqual([
          expect.objectContaining({
            childCareCategoryId: activeCategory.id,
            monthlyAmount: "42.1234",
          }),
        ])
      })
    })
  })
})
