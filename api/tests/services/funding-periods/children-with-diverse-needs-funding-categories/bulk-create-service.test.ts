import { type Attributes } from "@sequelize/core"

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
        await childrenWithDiverseNeedsFundingCategoryFactory
          .associations({ fundingPeriod: configuredFundingPeriod })
          .create({
            categoryName: "Additional support",
            fromAge: 2,
            toAge: 5,
            monthlyAmount: "123.4567",
          })
        await childrenWithDiverseNeedsFundingCategoryFactory
          .associations({ fundingPeriod: futureFundingPeriod })
          .create({ categoryName: "Future support", monthlyAmount: "999.0000" })
        const fundingCategoryFields: (keyof Attributes<ChildrenWithDiverseNeedsFundingCategory>)[] =
          ["fundingPeriodId", "categoryName", "fromAge", "toAge", "monthlyAmount", "deletedAt"]
        const originalChildrenWithDiverseNeedsFundingCategories =
          await ChildrenWithDiverseNeedsFundingCategory.findAll({
            attributes: fundingCategoryFields,
            paranoid: false,
            raw: true,
          })

        // Act
        await BulkCreateService.perform(targetFundingPeriod)

        // Assert
        const childrenWithDiverseNeedsFundingCategories =
          await ChildrenWithDiverseNeedsFundingCategory.findAll({
            attributes: fundingCategoryFields,
            paranoid: false,
            raw: true,
          })
        expect(childrenWithDiverseNeedsFundingCategories).to.have.deep.members([
          ...originalChildrenWithDiverseNeedsFundingCategories,
          {
            fundingPeriodId: targetFundingPeriod.id,
            categoryName: "Additional support",
            fromAge: 2,
            toAge: 5,
            monthlyAmount: "123.4567",
            deletedAt: null,
          },
        ])
      })

      test("when the latest configured year has only retired categories, preserves its empty catalog", async () => {
        // Arrange
        const olderFundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2023-2024" })
        const emptiedFundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2024-2025" })
        const targetFundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2025-2026" })
        await childrenWithDiverseNeedsFundingCategoryFactory
          .associations({ fundingPeriod: olderFundingPeriod })
          .create({ categoryName: "Older support", monthlyAmount: "100.0000" })
        const retiredChildrenWithDiverseNeedsFundingCategory =
          await childrenWithDiverseNeedsFundingCategoryFactory
            .associations({ fundingPeriod: emptiedFundingPeriod })
            .create({ categoryName: "Retired support", monthlyAmount: "150.0000" })
        await retiredChildrenWithDiverseNeedsFundingCategory.destroy()
        const originalChildrenWithDiverseNeedsFundingCategories =
          await ChildrenWithDiverseNeedsFundingCategory.findAll({
            paranoid: false,
            raw: true,
          })

        // Act
        await BulkCreateService.perform(targetFundingPeriod)

        // Assert
        const childrenWithDiverseNeedsFundingCategories =
          await ChildrenWithDiverseNeedsFundingCategory.findAll({
            paranoid: false,
            raw: true,
          })
        expect(childrenWithDiverseNeedsFundingCategories).to.have.deep.members(
          originalChildrenWithDiverseNeedsFundingCategories
        )
      })
    })
  })
})
