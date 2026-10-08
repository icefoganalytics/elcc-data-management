import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable("wage_enhancements")) return

  await knex.schema.createTable("wage_enhancements", (table) => {
    table.increments("id").notNullable().primary()
    table.integer("centre_id").notNullable()
    table.integer("employee_wage_tier_id").notNullable()
    table.string("employee_name", 100).notNullable()
    table.decimal("hours_estimated", 10, 2).notNullable()
    table.decimal("hours_actual", 10, 2).notNullable()
    table.specificType("created_at", "DATETIME2").notNullable().defaultTo(knex.raw("GETUTCDATE()"))
    table.specificType("updated_at", "DATETIME2").notNullable().defaultTo(knex.raw("GETUTCDATE()"))
    table.specificType("deleted_at", "DATETIMEOFFSET")

    table
      .foreign(["centre_id"], "FK__wage_enha__centr__2F9A1060")
      .references(["id"])
      .inTable("centres")

    table
      .foreign(["employee_wage_tier_id"], "FK__wage_enha__emplo__308E3499")
      .references(["id"])
      .inTable("employee_wage_tiers")
  })
}

export async function down(_knex: Knex): Promise<void> {
  throw new Error("The wage_enhancements baseline cannot be rolled back.")
}
