import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table) => {
    table
      .boolean("is_admin")
      .notNullable()
      .defaultTo(knex.raw("0"))
      .alter({ alterType: false, alterNullable: false })
    table
      .string("roles", 255)
      .notNullable()
      .defaultTo(knex.raw("N'user'"))
      .alter({ alterType: false, alterNullable: false })
  })
}

export async function down(_knex: Knex): Promise<void> {
  console.warn("User default normalization is irreversible; canonical defaults are retained.")
}
