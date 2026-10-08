import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable("payments")) return

  await knex.schema.createTable("payments", (table) => {
    table.increments("id").notNullable().primary()
    table.integer("centre_id").notNullable()
    table.string("fiscal_year", 10).notNullable()
    table.date("paid_on").notNullable()
    table.string("name", 100).notNullable()
    table.specificType("created_at", "DATETIME2").notNullable().defaultTo(knex.raw("GETUTCDATE()"))
    table.specificType("updated_at", "DATETIME2").notNullable().defaultTo(knex.raw("GETUTCDATE()"))
    table.integer("fiscal_period_id")
    table.decimal("amount", 15, 4).notNullable()
    table.specificType("deleted_at", "DATETIMEOFFSET")

    table
      .foreign(["centre_id"], "FK__payments__centre__1B9317B3")
      .references(["id"])
      .inTable("centres")

    table
      .foreign(["fiscal_period_id"], "FK__payments__fiscal__32767D0B")
      .references(["id"])
      .inTable("fiscal_periods")

    table
      .foreign(["fiscal_period_id"], "FK__payments__fiscal__336AA144")
      .references(["id"])
      .inTable("fiscal_periods")
  })
}

export async function down(_knex: Knex): Promise<void> {
  throw new Error("The payments baseline cannot be rolled back.")
}
