/**
 * REMOVABLE BACKFILL SEED
 *
 * This seed ensures dependencies for existing funding periods.
 * Can be removed once all funding periods have their dependencies properly created.
 */

import type { Knex } from "knex"

import { FundingPeriod } from "@/models"
import { FundingPeriods } from "@/services"

export async function seed(_knex: Knex): Promise<void> {
  await FundingPeriod.findEach(async (fundingPeriod) => {
    await FundingPeriods.FiscalPeriods.BulkEnsureService.perform(fundingPeriod)
    await FundingPeriods.EmployeeWageTiers.BulkEnsureService.perform(fundingPeriod)
    await FundingPeriods.ChildCareSpaceCategories.BulkEnsureService.perform(fundingPeriod)
    await FundingPeriods.FundingSubmissionLines.BulkEnsureService.perform(fundingPeriod)
  })
}
