import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("funding_reconciliations", (table) => {
    table.increments("id").notNullable().primary()
    table.integer("centre_id").notNullable().references("id").inTable("centres")
    table.integer("funding_period_id").notNullable().references("id").inTable("funding_periods")
    table.specificType("submission_date", "DATETIME2(0)")
    table.text("lines")
    table.integer("created_by_id").notNullable().references("id").inTable("users")
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
    "CREATE UNIQUE INDEX idx_funding_reconciliations_centre_period_unique ON funding_reconciliations (centre_id, funding_period_id) WHERE deleted_at IS NULL"
  )
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("funding_reconciliations")
}
