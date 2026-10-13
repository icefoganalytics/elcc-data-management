import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table) => {
    table.boolean("is_admin").notNullable().defaultTo(knex.raw("0")).alter()
    table.string("roles", 255).notNullable().defaultTo(knex.raw("N'user'")).alter()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table) => {
    table.boolean("is_admin").notNullable().defaultTo(0).alter()
    table.string("roles", 255).notNullable().defaultTo("user").alter()
  })
}
