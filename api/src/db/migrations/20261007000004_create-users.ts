import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable("users")) return

  await knex.schema.createTable("users", (table) => {
    table.string("email", 200).notNullable()
    table.string("sub", 200).notNullable()
    table.string("first_name", 100).notNullable()
    table.string("last_name", 100).notNullable()
    table.string("status", 50).notNullable()
    table.boolean("is_admin").notNullable().defaultTo(0)
    table.string("ynet_id", 50)
    table.string("directory_id", 50)
    table.increments("id").notNullable().primary()
    table.specificType("created_at", "DATETIME2").notNullable().defaultTo(knex.raw("GETUTCDATE()"))
    table.specificType("updated_at", "DATETIME2").notNullable().defaultTo(knex.raw("GETUTCDATE()"))
    table.string("roles", 255).notNullable().defaultTo("user")
    table.specificType("deleted_at", "DATETIMEOFFSET")

    table.unique(["email"], {
      indexName: "users_on_email_unique",
      predicate: knex.whereNull("deleted_at"),
    })
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("users")
}
