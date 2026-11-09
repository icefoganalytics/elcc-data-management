import { ChildrenWithDiverseNeedsFundingCategory } from "@/models"

import { childrenWithDiverseNeedsFundingCategoryFactory, fundingPeriodFactory } from "@/factories"

import BulkCreateService from "@/services/funding-periods/children-with-diverse-needs-funding-categories/bulk-create-service"

describe("api/src/services/funding-periods/children-with-diverse-needs-funding-categories/bulk-create-service.ts", () => {
  describe("BulkCreateService", () => {
    describe("#perform", () => {
      test("when the nearest earlier year has no category history, copies the latest earlier configuration", async () => {
        // Arrange
        const configuredPeriod = await fundingPeriodFactory.create({ fiscalYear: "2023-2024" })
        await fundingPeriodFactory.create({ fiscalYear: "2024-2025" })
        const targetPeriod = await fundingPeriodFactory.create({ fiscalYear: "2025-2026" })
        const futurePeriod = await fundingPeriodFactory.create({ fiscalYear: "2026-2027" })
        await childrenWithDiverseNeedsFundingCategoryFactory
          .associations({ fundingPeriod: configuredPeriod })
          .create({
            categoryName: "Additional support",
            fromAge: 2,
            toAge: 5,
            monthlyAmount: "123.4567",
          })
        await childrenWithDiverseNeedsFundingCategoryFactory
          .associations({ fundingPeriod: futurePeriod })
          .create({ categoryName: "Future support", monthlyAmount: "999.0000" })

        // Act
        await BulkCreateService.perform(targetPeriod)

        // Assert
        const categories = await ChildrenWithDiverseNeedsFundingCategory.findAll({
          where: { fundingPeriodId: targetPeriod.id },
        })
        expect(categories).toEqual([
          expect.objectContaining({
            fundingPeriodId: targetPeriod.id,
            categoryName: "Additional support",
            fromAge: 2,
            toAge: 5,
            monthlyAmount: "123.4567",
          }),
        ])
      })

      test("when the latest configured year has only retired categories, preserves its empty catalog", async () => {
        // Arrange
        const olderPeriod = await fundingPeriodFactory.create({ fiscalYear: "2023-2024" })
        const emptiedPeriod = await fundingPeriodFactory.create({ fiscalYear: "2024-2025" })
        const targetPeriod = await fundingPeriodFactory.create({ fiscalYear: "2025-2026" })
        await childrenWithDiverseNeedsFundingCategoryFactory
          .associations({ fundingPeriod: olderPeriod })
          .create({ categoryName: "Older support", monthlyAmount: "100.0000" })
        const retiredCategory = await childrenWithDiverseNeedsFundingCategoryFactory
          .associations({ fundingPeriod: emptiedPeriod })
          .create({ categoryName: "Retired support", monthlyAmount: "150.0000" })
        await retiredCategory.destroy()

        // Act
        await BulkCreateService.perform(targetPeriod)

        // Assert
        const categories = await ChildrenWithDiverseNeedsFundingCategory.findAll({
          where: { fundingPeriodId: targetPeriod.id },
        })
        expect(categories).toEqual([])
      })
    })
  })
})
