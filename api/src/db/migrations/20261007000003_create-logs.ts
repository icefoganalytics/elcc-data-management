import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable("logs")) return

  await knex.schema.createTable("logs", (table) => {
    table.increments("id").notNullable().primary()
    table.string("table_name", 200).notNullable()
    table.string("operation", 200).notNullable()
    table.string("user_email", 200).notNullable()
    table.string("data", 2000).notNullable()
    table.specificType("created_at", "DATETIME2").notNullable().defaultTo(knex.raw("GETUTCDATE()"))
    table.specificType("updated_at", "DATETIME2").notNullable().defaultTo(knex.raw("GETUTCDATE()"))
    table.specificType("deleted_at", "DATETIMEOFFSET")
  })
}

export async function down(_knex: Knex): Promise<void> {
  throw new Error("The logs baseline cannot be rolled back.")
}
