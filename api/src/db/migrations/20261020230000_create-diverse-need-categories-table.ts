import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable("children_with_diverse_needs_funding_categories")) {
    return
  }

  await knex.schema.createTable("children_with_diverse_needs_funding_categories", (table) => {
    table.increments("id").notNullable().primary()
    table.integer("funding_period_id").notNullable()
    table.string("category_name", 200).notNullable()
    table.integer("from_age")
    table.integer("to_age")
    table.decimal("monthly_amount", 15, 4).notNullable()
    table.timestamp("created_at").notNullable().defaultTo(knex.raw("GETUTCDATE()"))
    table.timestamp("updated_at").notNullable().defaultTo(knex.raw("GETUTCDATE()"))
    table.timestamp("deleted_at").nullable()

    table.foreign("funding_period_id").references("funding_periods.id")
    table.unique(["funding_period_id", "category_name"], {
      indexName:
        "unique_children_with_diverse_needs_funding_categories_on_funding_period_id_and_category_name",
      predicate: knex.whereNull("deleted_at"),
    })
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("children_with_diverse_needs_funding_categories")
}
