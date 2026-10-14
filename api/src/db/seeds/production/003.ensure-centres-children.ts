import type { Knex } from "knex"

import { Centre, FundingPeriod } from "@/models"
import { Centres } from "@/services"

/**
 * REMOVABLE BACKFILL SEED
 *
 * This seed ensures dependencies for existing centres.
 * Can be removed once all centres have their dependencies properly created.
 */
export async function seed(_knex: Knex): Promise<void> {
  await FundingPeriod.findEach(async (fundingPeriod) => {
    await Centre.findEach(async (centre) => {
      await Centres.FundingPeriods.EnsureChildrenService.perform(centre, fundingPeriod)
    })
  })
}
