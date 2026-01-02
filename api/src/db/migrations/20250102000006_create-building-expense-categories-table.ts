import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("building_expense_categories", (table) => {
    table.increments("id").notNullable().primary()
    table.integer("funding_region_id").notNullable().references("id").inTable("funding_regions")
    table.string("category", 100).notNullable()
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
    "CREATE UNIQUE INDEX idx_building_expense_categories_region_category_unique ON building_expense_categories (funding_region_id, category) WHERE deleted_at IS NULL"
  )
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("building_expense_categories")
}
