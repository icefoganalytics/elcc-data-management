import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable("quality_enhancements")) {
    return
  }

  await knex.schema.createTable("quality_enhancements", (table) => {
    table.increments("id").notNullable().primary()
    table.integer("centre_id").notNullable()
    table.integer("fiscal_period_id").notNullable()
    table.integer("category_id").notNullable()
    table.integer("child_care_space_category_id")
    table.string("line_name", 200).notNullable()
    table.decimal("base_monthly_amount", 15, 4).notNullable()
    table.decimal("hot_meal_increment_amount", 15, 4).notNullable().defaultTo(knex.raw("0"))
    table.date("hot_meal_applied_at")
    table.decimal("monthly_amount", 15, 4).notNullable()
    table.decimal("estimated_child_occupancy_rate", 15, 4).notNullable()
    table.decimal("actual_child_occupancy_rate", 15, 4).notNullable()
    table.decimal("estimated_computed_total", 15, 4).notNullable()
    table.decimal("actual_computed_total", 15, 4).notNullable()
    table.specificType("created_at", "DATETIME2").notNullable().defaultTo(knex.raw("GETUTCDATE()"))
    table.specificType("updated_at", "DATETIME2").notNullable().defaultTo(knex.raw("GETUTCDATE()"))
    table.specificType("deleted_at", "DATETIME2")

    table.foreign("centre_id").references("centres.id")
    table.foreign("fiscal_period_id").references("fiscal_periods.id")
    table.foreign("category_id").references("quality_enhancement_categories.id")
    table.foreign("child_care_space_category_id").references("child_care_space_categories.id")

    table.unique(["centre_id", "fiscal_period_id", "category_id"], {
      indexName: "unique_quality_enhancements_on_centre_id_fiscal_period_id_category_id",
      predicate: knex.whereNull("deleted_at"),
    })
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("quality_enhancements")
}
