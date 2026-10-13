import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("funding_reconciliation_adjustments", (table) => {
    table
      .decimal("funding_received_period_amount", 15, 4)
      .notNullable()
      .defaultTo(knex.raw("0"))
      .alter()
    table
      .decimal("eligible_expenses_period_amount", 15, 4)
      .notNullable()
      .defaultTo(knex.raw("0"))
      .alter()
    table
      .decimal("payroll_adjustments_period_amount", 15, 4)
      .notNullable()
      .defaultTo(knex.raw("0"))
      .alter()
    table.decimal("cumulative_balance_amount", 15, 4).notNullable().defaultTo(knex.raw("0")).alter()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("funding_reconciliation_adjustments", (table) => {
    table.decimal("funding_received_period_amount", 15, 4).notNullable().defaultTo(0).alter()
    table.decimal("eligible_expenses_period_amount", 15, 4).notNullable().defaultTo(0).alter()
    table.decimal("payroll_adjustments_period_amount", 15, 4).notNullable().defaultTo(0).alter()
    table.decimal("cumulative_balance_amount", 15, 4).notNullable().defaultTo(0).alter()
  })
}
