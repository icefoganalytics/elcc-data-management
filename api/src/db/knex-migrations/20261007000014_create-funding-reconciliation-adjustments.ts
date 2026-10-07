import type { Knex } from "knex"

import { shouldSkipBaselineTableCreation } from "@/db/has-historical-migration-ledger"

export async function up(knex: Knex): Promise<void> {
  if (await shouldSkipBaselineTableCreation(knex, "funding_reconciliation_adjustments")) return

  await knex.schema.createTable("funding_reconciliation_adjustments", (table) => {
    table.increments("id").notNullable().primary()
    table.integer("funding_reconciliation_id").notNullable()
    table.integer("fiscal_period_id").notNullable()
    table.decimal("funding_received_period_amount", 15, 4).notNullable().defaultTo(0)
    table.decimal("eligible_expenses_period_amount", 15, 4).notNullable().defaultTo(0)
    table.decimal("payroll_adjustments_period_amount", 15, 4).notNullable().defaultTo(0)
    table.decimal("cumulative_balance_amount", 15, 4).notNullable().defaultTo(0)
    table.specificType("created_at", "DATETIME2").notNullable().defaultTo(knex.raw("GETUTCDATE()"))
    table.specificType("updated_at", "DATETIME2").notNullable().defaultTo(knex.raw("GETUTCDATE()"))
    table.specificType("deleted_at", "DATETIME2")

    table
      .foreign(["fiscal_period_id"], "FK__funding_r__fisca__4959E263")
      .references(["id"])
      .inTable("fiscal_periods")

    table
      .foreign(["funding_reconciliation_id"], "FK__funding_r__fundi__4865BE2A")
      .references(["id"])
      .inTable("funding_reconciliations")
      .onDelete("CASCADE")

    table.unique(["funding_reconciliation_id", "fiscal_period_id"], {
      indexName:
        "unique_funding_reconciliation_adjustments_on_funding_reconciliation_id_fiscal_period_id",
      predicate: knex.whereNull("deleted_at"),
    })
  })
}

export async function down(_knex: Knex): Promise<void> {
  throw new Error("The funding_reconciliation_adjustments baseline cannot be rolled back.")
}
