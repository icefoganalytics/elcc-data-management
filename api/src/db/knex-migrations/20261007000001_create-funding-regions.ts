import type { Knex } from "knex"

import { shouldSkipBaselineTableCreation } from "@/db/has-historical-migration-ledger"

export async function up(knex: Knex): Promise<void> {
  if (await shouldSkipBaselineTableCreation(knex, "funding_regions")) return

  await knex.schema.createTable("funding_regions", (table) => {
    table.increments("id").notNullable().primary()
    table.string("region", 100).notNullable()
    table.decimal("subsidy_rate", 5, 4).notNullable()
    table.specificType("created_at", "DATETIME2").notNullable().defaultTo(knex.raw("GETUTCDATE()"))
    table.specificType("updated_at", "DATETIME2").notNullable().defaultTo(knex.raw("GETUTCDATE()"))
    table.specificType("deleted_at", "DATETIME2")
    table.decimal("hot_meal_increment_amount", 10, 4).notNullable().defaultTo(knex.raw("0.0000"))

    table.unique(["region"], {
      indexName: "unique_funding_regions_on_region",
      predicate: knex.whereNull("deleted_at"),
    })
  })
}

export async function down(_knex: Knex): Promise<void> {
  throw new Error("The funding_regions baseline cannot be rolled back.")
}
