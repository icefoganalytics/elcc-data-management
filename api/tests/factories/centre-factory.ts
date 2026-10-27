import FactoryShark from "factory-shark"
import { faker } from "@faker-js/faker"
import { type Includeable } from "@sequelize/core"

import { Centre } from "@/models"
import { CentreStatuses } from "@/models/centre"

import fundingRegionFactory from "@/factories/funding-region-factory"

const yukonCommunities = [
  "Carmacks",
  "Dawson",
  "Faro",
  "Haines Junction",
  "Mayo",
  "Teslin",
  "Watson Lake",
  "Whitehorse",
  "Ibex Valley",
  "Mount Lorne",
  "Carcross",
  "Beaver Creek",
  "Burwash Landing",
  "Destruction Bay",
  "Champagne",
]

type TransientParam = {
  include?: Includeable | Includeable[]
}

export const centreFactory = FactoryShark.define<Centre, TransientParam>(
  Centre,
  ({ sequence, transient, associate, afterCreate }) => {
    associate("fundingRegion", fundingRegionFactory)

    afterCreate(async (centre) => {
      if (transient.include !== undefined) {
        await centre.reload({ include: transient.include })
      }
    })

    const name = `${faker.company.name()} Centre ${sequence}`
    const community = faker.helpers.arrayElement(yukonCommunities)
    const isFirstNationProgram = faker.datatype.boolean({ probability: 0.3 })
    const status = faker.helpers.objectValue(CentreStatuses)

    return {
      name,
      community,
      isFirstNationProgram,
      status,
    }
  }
)

export default centreFactory
