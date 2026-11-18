import FactoryShark from "factory-shark"
import { faker } from "@faker-js/faker"

import { ChildCareCategory } from "@/models"
import fundingPeriodFactory from "@/factories/funding-period-factory"

export const childCareCategoryFactory = FactoryShark.define<ChildCareCategory>(
  ChildCareCategory,
  ({ sequence, associate }) => {
    associate("fundingPeriod", fundingPeriodFactory)

    return {
      categoryName: `${faker.commerce.productAdjective()} category-${sequence}`,
      fromAge: 0,
      toAge: 5,
    }
  }
)

export default childCareCategoryFactory
