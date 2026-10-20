import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable("administration_cost_categories")) {
    return
  }

  await knex.schema.createTable("administration_cost_categories", (table) => {
    table.increments("id").notNullable().primary()
    table.integer("funding_period_id").notNullable()
    table.integer("child_care_space_category_id")
    table.integer("source_funding_submission_line_id")
    table.string("category_name", 200).notNullable()
    table.integer("from_age")
    table.integer("to_age")
    table.decimal("monthly_amount", 15, 4).notNullable()
    table.specificType("created_at", "DATETIME2").notNullable().defaultTo(knex.raw("GETUTCDATE()"))
    table.specificType("updated_at", "DATETIME2").notNullable().defaultTo(knex.raw("GETUTCDATE()"))
    table.specificType("deleted_at", "DATETIME2")

    table.foreign("funding_period_id").references("funding_periods.id")
    table.foreign("child_care_space_category_id").references("child_care_space_categories.id")
    table.foreign("source_funding_submission_line_id").references("funding_submission_lines.id")

    table.unique(["funding_period_id", "category_name"], {
      indexName: "unique_administration_cost_categories_on_funding_period_id_category_name",
      predicate: knex.whereNull("deleted_at"),
    })
    table.unique(["funding_period_id", "source_funding_submission_line_id"], {
      indexName:
        "unique_administration_cost_categories_on_funding_period_id_source_funding_submission_line_id",
      predicate: knex.whereNotNull("source_funding_submission_line_id"),
    })
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("administration_cost_categories")
}
