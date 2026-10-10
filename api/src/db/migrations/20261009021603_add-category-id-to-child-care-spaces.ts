import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("child_care_spaces", (table) => {
    table.integer("category_id")
    table.foreign("category_id").references("child_care_space_categories.id")
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("child_care_spaces", (table) => {
    table.dropForeign("category_id")
    table.dropColumn("category_id")
  })
}
