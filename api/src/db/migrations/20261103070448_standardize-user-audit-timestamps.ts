import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    UPDATE users
    WITH
      (TABLOCKX)
    SET
      deleted_at = SWITCHOFFSET(deleted_at, '+00:00')
    WHERE
      deleted_at IS NOT NULL
  `)

  await knex.schema.alterTable("users", (table) => {
    table.dropUnique(["email"], "users_on_email_unique")
  })

  await knex.schema.alterTable("users", (table) => {
    table.timestamp("deleted_at").nullable().alter()
    table.unique(["email"], {
      indexName: "users_on_email_unique",
      predicate: knex.whereNull("deleted_at"),
    })
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table) => {
    table.dropUnique(["email"], "users_on_email_unique")
  })

  await knex.schema.alterTable("users", (table) => {
    table.specificType("deleted_at", "DATETIMEOFFSET").nullable().alter()
    table.unique(["email"], {
      indexName: "users_on_email_unique",
      predicate: knex.whereNull("deleted_at"),
    })
  })
}
