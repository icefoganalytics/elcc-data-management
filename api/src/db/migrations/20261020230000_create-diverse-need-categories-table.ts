import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable("diverse_need_categories")) {
    return
  }

  await knex.schema.createTable("diverse_need_categories", (table) => {
    table.increments("id").notNullable().primary()
    table.integer("funding_period_id").notNullable()
    table.string("category_name", 200).notNullable()
    table.integer("from_age")
    table.integer("to_age")
    table.decimal("monthly_amount", 15, 4).notNullable()
    table.specificType("created_at", "DATETIME2").notNullable().defaultTo(knex.raw("GETUTCDATE()"))
    table.specificType("updated_at", "DATETIME2").notNullable().defaultTo(knex.raw("GETUTCDATE()"))
    table.specificType("deleted_at", "DATETIME2")

    table.foreign("funding_period_id").references("funding_periods.id")
    table.unique(["funding_period_id", "category_name"], {
      indexName: "unique_diverse_need_categories_on_funding_period_id_and_category_name",
      predicate: knex.whereNull("deleted_at"),
    })
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("diverse_need_categories")
}
