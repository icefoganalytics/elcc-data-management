import Big from "big.js"

import { AdministrationCostCategory } from "@/models"

import {
  administrationCostCategoryFactory,
  childCareSpaceCategoryFactory,
  fundingPeriodFactory,
} from "@/factories"
import { BulkEnsureService } from "@/services/funding-periods/administration-cost-categories"

describe("api/src/services/funding-periods/administration-cost-categories/bulk-ensure-service.ts", () => {
  describe("BulkEnsureService", () => {
    describe("#perform", () => {
      test("when the funding period has no configuration, creates the seven defaults linked by name", async () => {
        // Arrange
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2024-2025" })
        const childCareSpaceCategories = await Promise.all(
          AdministrationCostCategory.DEFAULTS.map(({ categoryName }) =>
            childCareSpaceCategoryFactory.associations({ fundingPeriod }).create({ categoryName })
          )
        )

        // Act
        const administrationCostCategories = await BulkEnsureService.perform(fundingPeriod)

        // Assert
        expect(
          administrationCostCategories.map(({ categoryName, fromAge, toAge }) => ({
            categoryName,
            fromAge,
            toAge,
          }))
        ).toEqual(
          AdministrationCostCategory.DEFAULTS.map(({ categoryName, fromAge, toAge }) => ({
            categoryName,
            fromAge,
            toAge,
          }))
        )
        expect(
          administrationCostCategories.map(({ monthlyAmount }) => Big(monthlyAmount).toFixed(4))
        ).toEqual(["70.0000", "70.0000", "70.0000", "35.0000", "70.0000", "30.0000", "50.0000"])
        expect(
          administrationCostCategories.map(
            ({ childCareSpaceCategoryId }) =>
              childCareSpaceCategories.find(({ id }) => id === childCareSpaceCategoryId)
                ?.categoryName
          )
        ).toEqual(AdministrationCostCategory.DEFAULTS.map(({ categoryName }) => categoryName))
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
        const administrationCostCategories = await BulkEnsureService.perform(fundingPeriod)

        // Assert
        const categoryHistory = await AdministrationCostCategory.findAll({
          where: { fundingPeriodId: fundingPeriod.id },
          paranoid: false,
        })
        expect(administrationCostCategories).toEqual([])
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
