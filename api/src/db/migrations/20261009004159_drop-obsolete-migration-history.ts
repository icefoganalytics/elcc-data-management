import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("SequelizeMeta")
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.createTable("SequelizeMeta", (table) => {
    table.string("name", 255).notNullable().primary()
    table.specificType("created_at", "DATETIME2").notNullable().defaultTo(knex.raw("GETUTCDATE()"))
    table.specificType("updated_at", "DATETIME2").notNullable().defaultTo(knex.raw("GETUTCDATE()"))
  })
}
