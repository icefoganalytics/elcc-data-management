import type { Knex } from "knex"
import knex from "knex"

import { buildKnexConfig } from "@/db/db-migration-client"
import { up as createAdministrationCostCategories } from "@/db/migrations/20261020180000_create-administration-cost-categories-table"
import { up as createAdministrationCosts } from "@/db/migrations/20261020180001_create-administration-costs-table"

export async function withLegacyAdministrationSchema(
  scenario: (transaction: Knex.Transaction) => Promise<void>
): Promise<void> {
  const transactionClient = knex(buildKnexConfig())
  const rollback = new Error("Roll back historical Administration migration fixture schema")

  try {
    try {
      await transactionClient.transaction(async (transaction) => {
        await transaction.schema.dropTableIfExists("administration_costs")
        await transaction.schema.dropTableIfExists("administration_cost_categories")
        await createAdministrationCostCategories(transaction)
        await createAdministrationCosts(transaction)
        await scenario(transaction)
        await transaction.rollback(rollback)
      })
    } catch (error) {
      if (error !== rollback) {
        throw error
      }
    }
  } finally {
    await transactionClient.destroy()
  }
}
