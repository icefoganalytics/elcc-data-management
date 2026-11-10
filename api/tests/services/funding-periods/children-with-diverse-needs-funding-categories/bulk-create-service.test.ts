import { ChildrenWithDiverseNeedsFundingCategory } from "@/models"

import { childrenWithDiverseNeedsFundingCategoryFactory, fundingPeriodFactory } from "@/factories"

import BulkCreateService from "@/services/funding-periods/children-with-diverse-needs-funding-categories/bulk-create-service"

describe("api/src/services/funding-periods/children-with-diverse-needs-funding-categories/bulk-create-service.ts", () => {
  describe("BulkCreateService", () => {
    describe("#perform", () => {
      test("when the nearest earlier year has no category history, copies the latest earlier configuration", async () => {
        // Arrange
        const configuredFundingPeriod = await fundingPeriodFactory.create({
          fiscalYear: "2023-2024",
        })
        await fundingPeriodFactory.create({ fiscalYear: "2024-2025" })
        const targetFundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2025-2026" })
        const futureFundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2026-2027" })
        const configuredFundingCategory = await childrenWithDiverseNeedsFundingCategoryFactory
          .associations({ fundingPeriod: configuredFundingPeriod })
          .create({
            categoryName: "Additional support",
            fromAge: 2,
            toAge: 5,
            monthlyAmount: "123.4567",
          })
        const futureFundingCategory = await childrenWithDiverseNeedsFundingCategoryFactory
          .associations({ fundingPeriod: futureFundingPeriod })
          .create({
            categoryName: "Future support",
            fromAge: 3,
            toAge: 6,
            monthlyAmount: "999.0000",
          })

        // Act
        await BulkCreateService.perform(targetFundingPeriod)

        // Assert
        const childrenWithDiverseNeedsFundingCategories =
          await ChildrenWithDiverseNeedsFundingCategory.findAll()
        expect(childrenWithDiverseNeedsFundingCategories).toEqual([
          expect.objectContaining({
            id: configuredFundingCategory.id,
            fundingPeriodId: configuredFundingPeriod.id,
            categoryName: "Additional support",
            fromAge: 2,
            toAge: 5,
            monthlyAmount: "123.4567",
            deletedAt: null,
          }),
          expect.objectContaining({
            id: futureFundingCategory.id,
            fundingPeriodId: futureFundingPeriod.id,
            categoryName: "Future support",
            fromAge: 3,
            toAge: 6,
            monthlyAmount: "999",
            deletedAt: null,
          }),
          expect.objectContaining({
            fundingPeriodId: targetFundingPeriod.id,
            categoryName: "Additional support",
            fromAge: 2,
            toAge: 5,
            monthlyAmount: "123.4567",
            deletedAt: null,
          }),
        ])
      })

      test("when the latest configured year has only retired categories, preserves its empty catalog", async () => {
        // Arrange
        const olderFundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2023-2024" })
        const emptiedFundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2024-2025" })
        const targetFundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2025-2026" })
        const olderFundingCategory = await childrenWithDiverseNeedsFundingCategoryFactory
          .associations({ fundingPeriod: olderFundingPeriod })
          .create({
            categoryName: "Older support",
            fromAge: 2,
            toAge: 3,
            monthlyAmount: "100.0000",
          })
        const retiredChildrenWithDiverseNeedsFundingCategory =
          await childrenWithDiverseNeedsFundingCategoryFactory
            .associations({ fundingPeriod: emptiedFundingPeriod })
            .create({
              categoryName: "Retired support",
              fromAge: 2,
              toAge: 3,
              monthlyAmount: "150.0000",
            })
        await retiredChildrenWithDiverseNeedsFundingCategory.destroy()

        // Act
        await BulkCreateService.perform(targetFundingPeriod)

        // Assert
        const childrenWithDiverseNeedsFundingCategories =
          await ChildrenWithDiverseNeedsFundingCategory.findAll({
            paranoid: false,
          })
        expect(childrenWithDiverseNeedsFundingCategories).toEqual([
          expect.objectContaining({
            id: olderFundingCategory.id,
            fundingPeriodId: olderFundingPeriod.id,
            categoryName: "Older support",
            fromAge: 2,
            toAge: 3,
            monthlyAmount: "100",
            deletedAt: null,
          }),
          expect.objectContaining({
            id: retiredChildrenWithDiverseNeedsFundingCategory.id,
            fundingPeriodId: emptiedFundingPeriod.id,
            categoryName: "Retired support",
            fromAge: 2,
            toAge: 3,
            monthlyAmount: "150",
            deletedAt: retiredChildrenWithDiverseNeedsFundingCategory.deletedAt,
          }),
        ])
      })
    })
  })
})
