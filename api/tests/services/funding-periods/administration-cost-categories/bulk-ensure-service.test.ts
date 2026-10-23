import { AdministrationCostCategory } from "@/models"

import {
  administrationCostCategoryFactory,
  childCareSpaceCategoryFactory,
  fundingPeriodFactory,
} from "@/factories"

import BulkEnsureService from "@/services/funding-periods/administration-cost-categories/bulk-ensure-service"

describe("api/src/services/funding-periods/administration-cost-categories/bulk-ensure-service.ts", () => {
  describe("BulkEnsureService", () => {
    describe("#perform", () => {
      test("when the funding period has no configuration, creates the seven defaults linked by name", async () => {
        // Arrange
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2024-2025" })
        const childCareSpaceCategories = await Promise.all([
          childCareSpaceCategoryFactory.associations({ fundingPeriod }).create({
            categoryName: "Infants",
          }),
          childCareSpaceCategoryFactory.associations({ fundingPeriod }).create({
            categoryName: "Toddlers",
          }),
          childCareSpaceCategoryFactory.associations({ fundingPeriod }).create({
            categoryName: "Preschool",
          }),
          childCareSpaceCategoryFactory.associations({ fundingPeriod }).create({
            categoryName: "Kindergarten (PT)",
          }),
          childCareSpaceCategoryFactory.associations({ fundingPeriod }).create({
            categoryName: "Kindergarten (FT)",
          }),
          childCareSpaceCategoryFactory.associations({ fundingPeriod }).create({
            categoryName: "School Age (PT)",
          }),
          childCareSpaceCategoryFactory.associations({ fundingPeriod }).create({
            categoryName: "School Age (FT)",
          }),
        ])

        // Act
        const administrationCostCategories = await BulkEnsureService.perform(fundingPeriod)

        // Assert
        expect(administrationCostCategories).toEqual([
          expect.objectContaining({
            fundingPeriodId: fundingPeriod.id,
            childCareSpaceCategoryId: childCareSpaceCategories[0].id,
            categoryName: "Infants",
            fromAge: 0,
            toAge: 1,
            monthlyAmount: "70",
          }),
          expect.objectContaining({
            fundingPeriodId: fundingPeriod.id,
            childCareSpaceCategoryId: childCareSpaceCategories[1].id,
            categoryName: "Toddlers",
            fromAge: 2,
            toAge: 3,
            monthlyAmount: "70",
          }),
          expect.objectContaining({
            fundingPeriodId: fundingPeriod.id,
            childCareSpaceCategoryId: childCareSpaceCategories[2].id,
            categoryName: "Preschool",
            fromAge: 4,
            toAge: 5,
            monthlyAmount: "70",
          }),
          expect.objectContaining({
            fundingPeriodId: fundingPeriod.id,
            childCareSpaceCategoryId: childCareSpaceCategories[3].id,
            categoryName: "Kindergarten (PT)",
            fromAge: 5,
            toAge: 6,
            monthlyAmount: "35",
          }),
          expect.objectContaining({
            fundingPeriodId: fundingPeriod.id,
            childCareSpaceCategoryId: childCareSpaceCategories[4].id,
            categoryName: "Kindergarten (FT)",
            fromAge: 5,
            toAge: 6,
            monthlyAmount: "70",
          }),
          expect.objectContaining({
            fundingPeriodId: fundingPeriod.id,
            childCareSpaceCategoryId: childCareSpaceCategories[5].id,
            categoryName: "School Age (PT)",
            fromAge: 5,
            toAge: 6,
            monthlyAmount: "30",
          }),
          expect.objectContaining({
            fundingPeriodId: fundingPeriod.id,
            childCareSpaceCategoryId: childCareSpaceCategories[6].id,
            categoryName: "School Age (FT)",
            fromAge: 5,
            toAge: 6,
            monthlyAmount: "50",
          }),
        ])
      })

      test("when a later funding period is ensured, remaps linked space categories to that year", async () => {
        // Arrange
        const sourceFundingPeriod = await fundingPeriodFactory.create({
          fiscalYear: "2024-2025",
        })
        const targetFundingPeriod = await fundingPeriodFactory.create({
          fiscalYear: "2025-2026",
        })
        const sourceChildCareSpaceCategory = await childCareSpaceCategoryFactory
          .associations({ fundingPeriod: sourceFundingPeriod })
          .create({ categoryName: "Infants" })
        const targetChildCareSpaceCategory = await childCareSpaceCategoryFactory
          .associations({ fundingPeriod: targetFundingPeriod })
          .create({ categoryName: "Infants" })
        await administrationCostCategoryFactory
          .associations({
            fundingPeriod: sourceFundingPeriod,
            childCareSpaceCategory: sourceChildCareSpaceCategory,
          })
          .create({
            categoryName: "Infants",
            childCareSpaceCategoryId: sourceChildCareSpaceCategory.id,
            monthlyAmount: "68.0000",
          })

        // Act
        const targetAdministrationCostCategories =
          await BulkEnsureService.perform(targetFundingPeriod)

        // Assert
        expect(targetAdministrationCostCategories).toEqual([
          expect.objectContaining({
            fundingPeriodId: targetFundingPeriod.id,
            childCareSpaceCategoryId: targetChildCareSpaceCategory.id,
            categoryName: "Infants",
            monthlyAmount: "68",
          }),
        ])
      })

      test("when every category has been retired, preserves the deliberate empty configuration", async () => {
        // Arrange
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2024-2025" })
        const retiredCategory = await administrationCostCategoryFactory
          .associations({ fundingPeriod })
          .create({ categoryName: "Retired category" })
        await retiredCategory.destroy()

        // Act
        await BulkEnsureService.perform(fundingPeriod)

        // Assert
        const categoryHistory = await AdministrationCostCategory.findAll({
          paranoid: false,
        })
        expect(categoryHistory).toEqual([
          expect.objectContaining({
            id: retiredCategory.id,
            deletedAt: expect.any(Date),
          }),
        ])
      })
    })
  })
})
