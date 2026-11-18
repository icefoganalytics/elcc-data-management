import childCareCategoryFactory from "@/factories/child-care-category-factory"
import { AdministrationCostCategory, ChildCareCategory } from "@/models"

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
        const fundingPeriod = await fundingPeriodFactory.create({
          fiscalYear: "2024-2025",
        })
        const childCareCategories = await Promise.all(
          ChildCareCategory.DEFAULTS.map((category) =>
            childCareCategoryFactory.create({ ...category, fundingPeriodId: fundingPeriod.id })
          )
        )

        // Act
        const administrationCostCategories = await BulkEnsureService.perform(fundingPeriod)

        // Assert
        expect(administrationCostCategories).toEqual([
          expect.objectContaining({
            fundingPeriodId: fundingPeriod.id,
            childCareCategoryId: childCareCategories[0].id,
            categoryName: "Infants",
            fromAge: 0,
            toAge: 18,
            monthlyAmount: "70",
          }),
          expect.objectContaining({
            fundingPeriodId: fundingPeriod.id,
            childCareCategoryId: childCareCategories[1].id,
            categoryName: "Toddlers",
            fromAge: 19,
            toAge: 36,
            monthlyAmount: "70",
          }),
          expect.objectContaining({
            fundingPeriodId: fundingPeriod.id,
            childCareCategoryId: childCareCategories[2].id,
            categoryName: "Preschool",
            fromAge: 4,
            toAge: 5,
            monthlyAmount: "70",
          }),
          expect.objectContaining({
            fundingPeriodId: fundingPeriod.id,
            childCareCategoryId: childCareCategories[3].id,
            categoryName: "Kindergarten (PT)",
            fromAge: 5,
            toAge: 6,
            monthlyAmount: "35",
          }),
          expect.objectContaining({
            fundingPeriodId: fundingPeriod.id,
            childCareCategoryId: childCareCategories[4].id,
            categoryName: "Kindergarten (FT)",
            fromAge: 5,
            toAge: 6,
            monthlyAmount: "70",
          }),
          expect.objectContaining({
            fundingPeriodId: fundingPeriod.id,
            childCareCategoryId: childCareCategories[5].id,
            categoryName: "School Age (PT)",
            fromAge: 5,
            toAge: 6,
            monthlyAmount: "30",
          }),
          expect.objectContaining({
            fundingPeriodId: fundingPeriod.id,
            childCareCategoryId: childCareCategories[6].id,
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
        const sourceChildCareSpaceCategoryChildCareCategory = await childCareCategoryFactory.create(
          { fundingPeriodId: sourceFundingPeriod.id, categoryName: "Infants" }
        )
        const sourceChildCareSpaceCategory = await childCareSpaceCategoryFactory
          .associations({ fundingPeriod: sourceFundingPeriod })
          .create({
            childCareCategoryId: sourceChildCareSpaceCategoryChildCareCategory.id,
          })
        const targetChildCareSpaceCategoryChildCareCategory = await childCareCategoryFactory.create(
          { fundingPeriodId: targetFundingPeriod.id, categoryName: "Infants" }
        )
        const targetChildCareSpaceCategory = await childCareSpaceCategoryFactory
          .associations({ fundingPeriod: targetFundingPeriod })
          .create({
            childCareCategoryId: targetChildCareSpaceCategoryChildCareCategory.id,
          })
        await administrationCostCategoryFactory
          .associations({ fundingPeriod: sourceFundingPeriod })
          .create({
            monthlyAmount: "68.0000",
            childCareCategoryId: sourceChildCareSpaceCategory.childCareCategoryId,
          })

        // Act
        const targetAdministrationCostCategories =
          await BulkEnsureService.perform(targetFundingPeriod)

        // Assert
        expect(targetAdministrationCostCategories).toEqual([
          expect.objectContaining({
            fundingPeriodId: targetFundingPeriod.id,
            childCareCategoryId: targetChildCareSpaceCategory.childCareCategoryId,
            categoryName: "Infants",
            monthlyAmount: "68",
          }),
        ])
      })

      test("when every category has been retired, preserves the deliberate empty configuration", async () => {
        // Arrange
        const fundingPeriod = await fundingPeriodFactory.create({
          fiscalYear: "2024-2025",
        })
        const retiredCategoryChildCareCategory = await childCareCategoryFactory.create({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "Retired category",
        })
        const retiredCategory = await administrationCostCategoryFactory
          .associations({ fundingPeriod })
          .create({
            childCareCategoryId: retiredCategoryChildCareCategory.id,
          })
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
