import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("building_expenses", (table) => {
    table.increments("id").notNullable().primary()
    table.integer("centre_id").notNullable().references("id").inTable("centres")
    table.integer("fiscal_period_id").notNullable().references("id").inTable("fiscal_periods")
    table
      .integer("building_expense_category_id")
      .notNullable()
      .references("id")
      .inTable("building_expense_categories")
    table.decimal("amount", 10, 2).notNullable()
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
    "CREATE UNIQUE INDEX idx_building_expenses_centre_period_category_unique ON building_expenses (centre_id, fiscal_period_id, building_expense_category_id) WHERE deleted_at IS NULL"
  )
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("building_expenses")
}
