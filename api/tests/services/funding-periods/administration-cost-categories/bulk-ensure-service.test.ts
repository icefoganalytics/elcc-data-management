import childCareCategoryFactory from "@/factories/child-care-category-factory"
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
        const fundingPeriod = await fundingPeriodFactory.create({
          fiscalYear: "2024-2025",
        })
        const infantsChildCareCategory = await childCareCategoryFactory.create({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "Infants",
        })
        const toddlersChildCareCategory = await childCareCategoryFactory.create({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "Toddlers",
        })
        const preschoolChildCareCategory = await childCareCategoryFactory.create({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "Preschool",
        })
        const partTimeKindergartenChildCareCategory = await childCareCategoryFactory.create({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "Kindergarten (PT)",
        })
        const fullTimeKindergartenChildCareCategory = await childCareCategoryFactory.create({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "Kindergarten (FT)",
        })
        const partTimeSchoolAgeChildCareCategory = await childCareCategoryFactory.create({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "School Age (PT)",
        })
        const fullTimeSchoolAgeChildCareCategory = await childCareCategoryFactory.create({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "School Age (FT)",
        })
        const childCareSpaceCategories = await Promise.all([
          childCareSpaceCategoryFactory
            .associations({
              fundingPeriod,
              childCareCategory: infantsChildCareCategory,
            })
            .create(),
          childCareSpaceCategoryFactory
            .associations({
              fundingPeriod,
              childCareCategory: toddlersChildCareCategory,
            })
            .create(),
          childCareSpaceCategoryFactory
            .associations({
              fundingPeriod,
              childCareCategory: preschoolChildCareCategory,
            })
            .create(),
          childCareSpaceCategoryFactory
            .associations({
              fundingPeriod,
              childCareCategory: partTimeKindergartenChildCareCategory,
            })
            .create(),
          childCareSpaceCategoryFactory
            .associations({
              fundingPeriod,
              childCareCategory: fullTimeKindergartenChildCareCategory,
            })
            .create(),
          childCareSpaceCategoryFactory
            .associations({
              fundingPeriod,
              childCareCategory: partTimeSchoolAgeChildCareCategory,
            })
            .create(),
          childCareSpaceCategoryFactory
            .associations({
              fundingPeriod,
              childCareCategory: fullTimeSchoolAgeChildCareCategory,
            })
            .create(),
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
        const sourceChildCareSpaceCategoryChildCareCategory = await childCareCategoryFactory.create({
          fundingPeriodId: sourceFundingPeriod.id,
          categoryName: "Infants",
        })
        const sourceChildCareSpaceCategory = await childCareSpaceCategoryFactory
          .associations({
            fundingPeriod: sourceFundingPeriod,
            childCareCategory: sourceChildCareSpaceCategoryChildCareCategory,
          })
          .create()
        const targetChildCareSpaceCategoryChildCareCategory = await childCareCategoryFactory.create({
          fundingPeriodId: targetFundingPeriod.id,
          categoryName: "Infants",
        })
        const targetChildCareSpaceCategory = await childCareSpaceCategoryFactory
          .associations({
            fundingPeriod: targetFundingPeriod,
            childCareCategory: targetChildCareSpaceCategoryChildCareCategory,
          })
          .create()
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
        const fundingPeriod = await fundingPeriodFactory.create({
          fiscalYear: "2024-2025",
        })
        const retiredCategory = await administrationCostCategoryFactory
          .associations({
            fundingPeriod,
          })
          .create({
            categoryName: "Retired category",
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
