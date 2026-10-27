import FactoryShark from "factory-shark"
import { faker } from "@faker-js/faker"

import { ChildCareSpaceCategory } from "@/models"

import fundingPeriodFactory from "@/factories/funding-period-factory"

export const childCareSpaceCategoryFactory = FactoryShark.define<ChildCareSpaceCategory>(
  ChildCareSpaceCategory,
  ({ sequence, associate }) => {
    associate("fundingPeriod", fundingPeriodFactory)

    const categoryName = `${faker.commerce.productAdjective()} spaces-${sequence}`

    return {
      categoryName,
      fromAge: 0,
      toAge: 5,
      monthlyAmount: "100.0000",
    }
  }
)

export default childCareSpaceCategoryFactory
