import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("users", (table) => {
    table.increments("id").notNullable().primary()
    table.string("email", 100).notNullable()
    table.string("status", 100).notNullable()
    table.string("first_name", 100)
    table.string("last_name", 100)
    table.string("position", 100)
    table.string("department", 100)
    table.string("division", 100)
    table.string("branch", 100)
    table.string("unit", 100)
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

  await knex.raw(
    "CREATE UNIQUE INDEX idx_users_email_unique ON users (email) WHERE deleted_at IS NULL"
  )
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("users")
}
