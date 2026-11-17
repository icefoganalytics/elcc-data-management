import type { Knex } from "knex"

const PROGRAM_CATEGORY_TABLES = [
  "child_care_space_categories",
  "administration_cost_categories",
  "quality_enhancement_categories",
] as const

export async function up(knex: Knex): Promise<void> {
  for (const tableName of PROGRAM_CATEGORY_TABLES) {
    await knex.schema.alterTable(tableName, (table) => {
      table.integer("child_care_category_id")

      table.foreign("child_care_category_id").references("child_care_categories.id")
    })
  }
}

export async function down(knex: Knex): Promise<void> {
  for (const tableName of PROGRAM_CATEGORY_TABLES) {
    await knex.schema.alterTable(tableName, (table) => {
      table.dropForeign("child_care_category_id")
      table.dropColumn("child_care_category_id")
    })
  }
}
