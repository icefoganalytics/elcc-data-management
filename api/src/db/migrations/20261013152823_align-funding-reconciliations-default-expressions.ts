import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("funding_reconciliations", (table) => {
    table.string("status", 20).notNullable().defaultTo(knex.raw("N'draft'")).alter()
    table
      .decimal("funding_received_total_amount", 15, 4)
      .notNullable()
      .defaultTo(knex.raw("0"))
      .alter()
    table
      .decimal("eligible_expenses_total_amount", 15, 4)
      .notNullable()
      .defaultTo(knex.raw("0"))
      .alter()
    table
      .decimal("payroll_adjustments_total_amount", 15, 4)
      .notNullable()
      .defaultTo(knex.raw("0"))
      .alter()
    table.decimal("final_balance_amount", 15, 4).notNullable().defaultTo(knex.raw("0")).alter()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("funding_reconciliations", (table) => {
    table.string("status", 20).notNullable().defaultTo("draft").alter()
    table.decimal("funding_received_total_amount", 15, 4).notNullable().defaultTo(0).alter()
    table.decimal("eligible_expenses_total_amount", 15, 4).notNullable().defaultTo(0).alter()
    table.decimal("payroll_adjustments_total_amount", 15, 4).notNullable().defaultTo(0).alter()
    table.decimal("final_balance_amount", 15, 4).notNullable().defaultTo(0).alter()
  })
}
