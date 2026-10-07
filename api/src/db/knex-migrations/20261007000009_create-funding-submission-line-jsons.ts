import type { Knex } from "knex"

import { shouldSkipBaselineTableCreation } from "@/db/has-historical-migration-ledger"

export async function up(knex: Knex): Promise<void> {
  if (await shouldSkipBaselineTableCreation(knex, "funding_submission_line_jsons")) return

  await knex.schema.createTable("funding_submission_line_jsons", (table) => {
    table.increments("id").notNullable().primary()
    table.integer("centre_id").notNullable()
    table.string("fiscal_year", 10).notNullable()
    table.string("date_name", 100).notNullable()
    table.specificType("date_start", "DATETIME2(0)").notNullable()
    table.specificType("date_end", "DATETIME2(0)").notNullable()
    table.text("values").notNullable()
    table.specificType("created_at", "DATETIME2").notNullable().defaultTo(knex.raw("GETUTCDATE()"))
    table.specificType("updated_at", "DATETIME2").notNullable().defaultTo(knex.raw("GETUTCDATE()"))
    table.specificType("deleted_at", "DATETIMEOFFSET")

    table
      .foreign(["centre_id"], "FK__funding_s__centr__7EF6D905")
      .references(["id"])
      .inTable("centres")
  })
}

export async function down(_knex: Knex): Promise<void> {
  throw new Error("The funding_submission_line_jsons baseline cannot be rolled back.")
}
