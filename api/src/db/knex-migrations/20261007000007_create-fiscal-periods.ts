import type { Knex } from "knex"

import { shouldSkipBaselineTableCreation } from "@/db/has-historical-migration-ledger"

export async function up(knex: Knex): Promise<void> {
  if (await shouldSkipBaselineTableCreation(knex, "fiscal_periods")) return

  await knex.schema.createTable("fiscal_periods", (table) => {
    table.increments("id").notNullable().primary()
    table.string("fiscal_year", 10).notNullable()
    table.string("month", 10).notNullable()
    table.specificType("date_start", "DATETIME2(0)").notNullable()
    table.specificType("date_end", "DATETIME2(0)").notNullable()
    table.specificType("created_at", "DATETIME2").notNullable().defaultTo(knex.raw("GETUTCDATE()"))
    table.specificType("updated_at", "DATETIME2").notNullable().defaultTo(knex.raw("GETUTCDATE()"))
    table.integer("funding_period_id").notNullable()
    table.specificType("deleted_at", "DATETIMEOFFSET")

    table
      .foreign(["funding_period_id"], "fiscal_periods_funding_period_id_funding_periods_fk")
      .references(["id"])
      .inTable("funding_periods")
      .onDelete("CASCADE")
      .onUpdate("CASCADE")

    table.unique(["fiscal_year", "month"], {
      indexName: "fiscal_periods_fiscal_year_month_unique",
      predicate: knex.whereNull("deleted_at"),
    })

    table.unique(["funding_period_id", "fiscal_year", "month"], {
      indexName: "fiscal_periods_funding_period_id_fiscal_year_month_unique",
      predicate: knex.whereNull("deleted_at"),
    })
  })
}

export async function down(_knex: Knex): Promise<void> {
  throw new Error("The fiscal_periods baseline cannot be rolled back.")
}
