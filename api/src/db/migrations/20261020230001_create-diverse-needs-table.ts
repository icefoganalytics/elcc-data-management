import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable("diverse_needs")) {
    return
  }

  await knex.schema.createTable("diverse_needs", (table) => {
    table.increments("id").notNullable().primary()
    table.integer("centre_id").notNullable()
    table.integer("fiscal_period_id").notNullable()
    table.integer("category_id").notNullable()
    table.string("line_name", 200).notNullable()
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
    table.foreign("category_id").references("diverse_need_categories.id")
    table.unique(["centre_id", "fiscal_period_id", "category_id"], {
      indexName: "unique_diverse_needs_on_centre_id_fiscal_period_id_category_id",
      predicate: knex.whereNull("deleted_at"),
    })
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("diverse_needs")
}
