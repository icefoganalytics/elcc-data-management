import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("logs", (table) => {
    table.increments("id").notNullable().primary()
    table.string("category", 100)
    table.string("description", 500)
    table.text("data")
    table
      .specificType("created_at", "DATETIME2(0)")
      .notNullable()
      .defaultTo(knex.raw("GETUTCDATE()"))
    table
      .specificType("updated_at", "DATETIME2(0)")
      .notNullable()
      .defaultTo(knex.raw("GETUTCDATE()"))
    table.specificType("deleted_at", "DATETIMEOFFSET")
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("logs")
}
