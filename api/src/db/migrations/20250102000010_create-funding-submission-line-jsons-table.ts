import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("funding_submission_line_jsons", (table) => {
    table.increments("id").notNullable().primary()
    table.integer("centre_id").notNullable().references("id").inTable("centres")
    table.text("lines").notNullable()
    table.string("fiscal_year", 10)
    table.integer("month_from")
    table.integer("month_to")
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
  await knex.schema.dropTable("funding_submission_line_jsons")
}
