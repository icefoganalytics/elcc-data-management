import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("payments", (table) => {
    table.increments("id").notNullable().primary()
    table.integer("centre_id").notNullable().references("id").inTable("centres")
    table.integer("fiscal_period_id").notNullable().references("id").inTable("fiscal_periods")
    table.string("payment_type", 100).notNullable()
    table.decimal("estimate", 10, 2)
    table.decimal("actual", 10, 2)
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

  await knex.raw(
    "CREATE UNIQUE INDEX idx_payments_centre_period_type_unique ON payments (centre_id, fiscal_period_id, payment_type) WHERE deleted_at IS NULL"
  )
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("payments")
}
