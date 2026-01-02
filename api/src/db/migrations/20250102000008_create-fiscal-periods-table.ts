import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("fiscal_periods", (table) => {
    table.increments("id").notNullable().primary()
    table.integer("funding_period_id").notNullable().references("id").inTable("funding_periods")
    table.specificType("from_date", "DATETIME2(0)").notNullable()
    table.specificType("to_date", "DATETIME2(0)").notNullable()
    table.integer("month").notNullable()
    table.integer("year").notNullable()
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
    "CREATE UNIQUE INDEX idx_fiscal_periods_period_month_year_unique ON fiscal_periods (funding_period_id, month, year) WHERE deleted_at IS NULL"
  )
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("fiscal_periods")
}
