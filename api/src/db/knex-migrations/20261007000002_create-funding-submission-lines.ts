import type { Knex } from "knex"

import { shouldSkipBaselineTableCreation } from "@/db/has-historical-migration-ledger"

export async function up(knex: Knex): Promise<void> {
  if (await shouldSkipBaselineTableCreation(knex, "funding_submission_lines")) return

  await knex.schema.createTable("funding_submission_lines", (table) => {
    table.increments("id").notNullable().primary()
    table.string("fiscal_year", 10).notNullable()
    table.string("section_name", 200).notNullable()
    table.string("line_name", 200).notNullable()
    table.integer("from_age")
    table.integer("to_age")
    table.decimal("monthly_amount", 15, 4).notNullable()
    table.specificType("created_at", "DATETIME2").notNullable().defaultTo(knex.raw("GETUTCDATE()"))
    table.specificType("updated_at", "DATETIME2").notNullable().defaultTo(knex.raw("GETUTCDATE()"))
    table.specificType("deleted_at", "DATETIMEOFFSET")
  })
}

export async function down(_knex: Knex): Promise<void> {
  throw new Error("The funding_submission_lines baseline cannot be rolled back.")
}
