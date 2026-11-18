import { faker } from "@faker-js/faker"
import FactoryShark from "factory-shark"
import { isNil, isUndefined } from "lodash"

import { AdministrationCost, ChildCareSpaceCategory } from "@/models"

import administrationCostCategoryFactory from "@/factories/administration-cost-category-factory"
import centreFactory from "@/factories/centre-factory"
import childCareSpaceCategoryFactory from "@/factories/child-care-space-category-factory"
import fiscalPeriodFactory from "@/factories/fiscal-period-factory"

export const administrationCostFactory = FactoryShark.define<AdministrationCost>(
  AdministrationCost,
  ({ associate, params, beforeCreate }) => {
    associate("centre", centreFactory)
    const fiscalPeriod = associate("fiscalPeriod", fiscalPeriodFactory)
    const category = associate("category", administrationCostCategoryFactory, (resolvedParams) => ({
      fundingPeriodId: resolvedParams.fiscalPeriod?.fundingPeriodId ?? fiscalPeriod.fundingPeriodId,
    }))

    if (!isNil(params.childCareSpaceCategoryId) || !isNil(params.childCareSpaceCategory)) {
      associate("childCareSpaceCategory", childCareSpaceCategoryFactory, (resolvedParams) => ({
        fundingPeriodId:
          resolvedParams.fiscalPeriod?.fundingPeriodId ?? fiscalPeriod.fundingPeriodId,
      }))
    }

    const categoryDefaults = params.category ?? category

    beforeCreate(async (administrationCost) => {
      const resolvedCategory = administrationCost.category
      if (isUndefined(resolvedCategory)) return

      if (isUndefined(params.lineName)) {
        administrationCost.lineName = resolvedCategory.categoryName
      }

      if (isUndefined(params.monthlyAmount)) {
        administrationCost.monthlyAmount = resolvedCategory.monthlyAmount
      }

      if (
        isUndefined(params.childCareSpaceCategoryId) &&
        isUndefined(params.childCareSpaceCategory)
      ) {
        const spaceCategory = await ChildCareSpaceCategory.findOne({
          attributes: ["id"],
          where: {
            fundingPeriodId: resolvedCategory.fundingPeriodId,
            childCareCategoryId: resolvedCategory.childCareCategoryId,
          },
        })
        administrationCost.childCareSpaceCategoryId = spaceCategory?.id ?? null
      }
    })

    return {
      childCareSpaceCategoryId: null,
      lineName: categoryDefaults.categoryName,
      monthlyAmount: categoryDefaults.monthlyAmount,
      estimatedChildOccupancyRate: faker.finance.amount({
        min: 0,
        max: 1,
        dec: 4,
      }),
      actualChildOccupancyRate: faker.finance.amount({
        min: 0,
        max: 1,
        dec: 4,
      }),
      estimatedComputedTotal: "0.0000",
      actualComputedTotal: "0.0000",
    }
  }
)

export default administrationCostFactory
