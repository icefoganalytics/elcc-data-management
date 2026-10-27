import FactoryShark from "factory-shark"
import { faker } from "@faker-js/faker"

import { FundingRegion } from "@/models"

export const fundingRegionFactory = FactoryShark.define<FundingRegion>(
  FundingRegion,
  ({ sequence }) => {
    const randomCityLowerCase = faker.location.city().toLowerCase()
    const region = `${randomCityLowerCase}-${sequence}`
    const subsidyRate = faker.finance.amount({ min: 0.01, max: 0.5, dec: 4 })

    return {
      region,
      subsidyRate,
    }
  }
)

export default fundingRegionFactory
