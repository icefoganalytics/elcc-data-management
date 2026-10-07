import type { Knex } from "knex"

import { shouldSkipBaselineTableCreation } from "@/db/has-historical-migration-ledger"

export async function up(knex: Knex): Promise<void> {
  if (await shouldSkipBaselineTableCreation(knex, "building_expense_categories")) return

  await knex.schema.createTable("building_expense_categories", (table) => {
    table.increments("id").notNullable().primary()
    table.integer("funding_region_id").notNullable()
    table.string("category_name", 100).notNullable()
    table.decimal("subsidy_rate", 5, 4).notNullable()
    table.specificType("created_at", "DATETIME2").notNullable().defaultTo(knex.raw("GETUTCDATE()"))
    table.specificType("updated_at", "DATETIME2").notNullable().defaultTo(knex.raw("GETUTCDATE()"))
    table.specificType("deleted_at", "DATETIME2")

    table
      .foreign(["funding_region_id"], "FK__building___fundi__53D770D6")
      .references(["id"])
      .inTable("funding_regions")

    table.unique(["funding_region_id", "category_name"], {
      indexName: "unique_building_expense_categories_on_funding_region_id_category_name",
      predicate: knex.whereNull("deleted_at"),
    })
  })
}

export async function down(_knex: Knex): Promise<void> {
  throw new Error("The building_expense_categories baseline cannot be rolled back.")
}
