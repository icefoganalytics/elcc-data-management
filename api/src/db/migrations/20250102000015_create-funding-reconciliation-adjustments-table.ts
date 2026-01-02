import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("funding_reconciliation_adjustments", (table) => {
    table.increments("id").notNullable().primary()
    table
      .integer("funding_reconciliation_id")
      .notNullable()
      .references("id")
      .inTable("funding_reconciliations")
    table.integer("fiscal_period_id").notNullable().references("id").inTable("fiscal_periods")
    table.string("adjustment_type", 100).notNullable()
    table.decimal("amount", 10, 2).notNullable()
    table.string("description", 500)
    table
      .specificType("created_at", "DATETIME2(0)")
      .notNullable()
      .defaultTo(knex.raw("GETUTCDATE()"))
    table
      .specificType("updated_at", "DATETIME2(0)")
      .notNullable()
      .defaultTo(knex.raw("GETUTCDATE()"))
    table.specificType("deleted_at", "DATETIMEOFFSET")
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("funding_reconciliation_adjustments")
}
