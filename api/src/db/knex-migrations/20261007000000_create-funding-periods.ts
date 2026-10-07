import type { Knex } from "knex"

import {
  assertApplicationSchemaIsEmpty,
  shouldSkipBaselineTableCreation,
} from "@/db/has-historical-migration-ledger"

export async function up(knex: Knex): Promise<void> {
  await assertApplicationSchemaIsEmpty(knex)

  if (await shouldSkipBaselineTableCreation(knex, "funding_periods")) return

  await knex.schema.createTable("funding_periods", (table) => {
    table.increments("id").notNullable().primary()
    table.string("fiscal_year", 10).notNullable()
    table.specificType("from_date", "DATETIME2(0)").notNullable()
    table.specificType("to_date", "DATETIME2(0)").notNullable()
    table.string("title", 100).notNullable()
    table.specificType("created_at", "DATETIME2").notNullable().defaultTo(knex.raw("GETUTCDATE()"))
    table.specificType("updated_at", "DATETIME2").notNullable().defaultTo(knex.raw("GETUTCDATE()"))
    table.specificType("deleted_at", "DATETIMEOFFSET")
  })
}

export async function down(_knex: Knex): Promise<void> {
  throw new Error("The funding_periods baseline cannot be rolled back.")
}
