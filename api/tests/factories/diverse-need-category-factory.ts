import FactoryShark from "factory-shark"

import { DiverseNeedCategory } from "@/models"

import fundingPeriodFactory from "@/factories/funding-period-factory"

export const diverseNeedCategoryFactory = FactoryShark.define<DiverseNeedCategory>(
  DiverseNeedCategory,
  ({ associate, sequence }) => {
    associate("fundingPeriod", fundingPeriodFactory)

    return {
      categoryName: `Diverse Need Category ${sequence}`,
      fromAge: 2,
      toAge: 3,
      monthlyAmount: "54.9600",
    }
  }
)

export default diverseNeedCategoryFactory
