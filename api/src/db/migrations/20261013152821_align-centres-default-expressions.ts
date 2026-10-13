import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("centres", (table) => {
    table.boolean("hot_meal").notNullable().defaultTo(knex.raw("0")).alter()
    table.boolean("is_first_nation_program").notNullable().defaultTo(knex.raw("0")).alter()
    table.decimal("building_usage_percent", 5, 2).notNullable().defaultTo(knex.raw("100")).alter()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("centres", (table) => {
    table.boolean("hot_meal").notNullable().defaultTo(0).alter()
    table.boolean("is_first_nation_program").notNullable().defaultTo(0).alter()
    table.decimal("building_usage_percent", 5, 2).notNullable().defaultTo(100).alter()
  })
}
