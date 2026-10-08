import type { Knex } from "knex"

import { isNil } from "lodash"

import { FundingRegion, User } from "@/models"
import { FundingRegions } from "@/services"

export async function seed(_knex: Knex): Promise<void> {
  const systemUser = await User.findOne({
    where: {
      email: "system.user@elcc.com",
    },
    rejectOnEmpty: true,
  })

  for (const fundingRegionAttributes of FundingRegion.DEFAULTS) {
    const fundingRegion = await FundingRegion.findOne({
      where: {
        region: fundingRegionAttributes.region,
      },
    })
    if (isNil(fundingRegion)) {
      await FundingRegions.CreateService.perform(fundingRegionAttributes, systemUser)
    }
  }
}
