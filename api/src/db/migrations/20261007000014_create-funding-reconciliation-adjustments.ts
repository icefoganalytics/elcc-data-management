import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable("funding_reconciliation_adjustments")) return

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

    table.foreign("fiscal_period_id").references("fiscal_periods.id")

    table
      .foreign("funding_reconciliation_id")
      .references("funding_reconciliations.id")
      .onDelete("CASCADE")

    table.unique(["funding_reconciliation_id", "fiscal_period_id"], {
      indexName:
        "unique_funding_reconciliation_adjustments_on_funding_reconciliation_id_fiscal_period_id",
      predicate: knex.whereNull("deleted_at"),
    })
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("funding_reconciliation_adjustments")
}
