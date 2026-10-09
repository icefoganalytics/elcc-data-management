import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable("building_expenses")) return

  await knex.schema.createTable("building_expenses", (table) => {
    table.increments("id").notNullable().primary()
    table.integer("category_id").notNullable()
    table.integer("centre_id").notNullable()
    table.integer("fiscal_period_id").notNullable()
    table.decimal("subsidy_rate", 5, 4).notNullable()
    table.decimal("building_usage_percent", 5, 2).notNullable()
    table.decimal("estimated_cost", 15, 4).notNullable()
    table.decimal("actual_cost", 15, 4).notNullable()
    table.decimal("total_cost", 15, 4).notNullable()
    table.text("notes")
    table.specificType("created_at", "DATETIME2").notNullable().defaultTo(knex.raw("GETUTCDATE()"))
    table.specificType("updated_at", "DATETIME2").notNullable().defaultTo(knex.raw("GETUTCDATE()"))
    table.specificType("deleted_at", "DATETIME2")
    table.string("funding_region_snapshot", 100).notNullable()

    table.foreign("category_id").references("building_expense_categories.id")

    table.foreign("centre_id").references("centres.id")

    table.foreign("fiscal_period_id").references("fiscal_periods.id")

    table.unique(["centre_id", "fiscal_period_id", "category_id"], {
      indexName: "unique_building_expenses_on_centre_id_fiscal_period_id_category_id",
      predicate: knex.whereNull("deleted_at"),
    })
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("building_expenses")
}
