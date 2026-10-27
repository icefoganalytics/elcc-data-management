import { faker } from "@faker-js/faker"
import FactoryShark from "factory-shark"
import { isNil } from "lodash"

import { AdministrationCostCategory } from "@/models"

import childCareSpaceCategoryFactory from "@/factories/child-care-space-category-factory"
import fundingPeriodFactory from "@/factories/funding-period-factory"

export const administrationCostCategoryFactory = FactoryShark.define<AdministrationCostCategory>(
  AdministrationCostCategory,
  ({ associate, params, sequence }) => {
    const fundingPeriod = associate("fundingPeriod", fundingPeriodFactory)

    if (!isNil(params.childCareSpaceCategoryId) || !isNil(params.childCareSpaceCategory)) {
      associate("childCareSpaceCategory", childCareSpaceCategoryFactory, (resolvedParams) => ({
        fundingPeriodId: resolvedParams.fundingPeriodId ?? fundingPeriod.id,
      }))
    }

    return {
      childCareSpaceCategoryId: null,
      categoryName: `${faker.commerce.productAdjective()} admin-${sequence}`,
      fromAge: 0,
      toAge: 5,
      monthlyAmount: "100.0000",
    }
  }
)

export default administrationCostCategoryFactory
