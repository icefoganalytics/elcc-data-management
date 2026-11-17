import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("child_care_categories", (table) => {
    table.increments("id").notNullable().primary()
    table.integer("funding_period_id").notNullable()
    table.string("category_name", 200).notNullable()
    table.integer("from_age")
    table.integer("to_age")

    table.timestamp("created_at").notNullable().defaultTo(knex.raw("GETUTCDATE()"))
    table.timestamp("updated_at").notNullable().defaultTo(knex.raw("GETUTCDATE()"))
    table.timestamp("deleted_at")

    table.foreign("funding_period_id").references("funding_periods.id")
    table.unique(["funding_period_id", "category_name"], {
      indexName: "unique_child_care_categories_on_funding_period_id_category_name",
      predicate: knex.whereNull("deleted_at"),
    })
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("child_care_categories")
}
