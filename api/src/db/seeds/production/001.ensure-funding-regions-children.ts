/**
 * REMOVABLE BACKFILL SEED
 *
 * This seed ensures dependencies for existing funding regions.
 * Can be removed once all funding regions have their dependencies properly created.
 */

import type { Knex } from "knex"

import { FundingRegion } from "@/models"
import { FundingRegions } from "@/services"

export async function seed(_knex: Knex): Promise<void> {
  await FundingRegion.findEach(async (fundingRegion) => {
    await FundingRegions.EnsureChildrenService.perform(fundingRegion)
  })
}
