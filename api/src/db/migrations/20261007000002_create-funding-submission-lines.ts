import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable("funding_submission_lines")) return

  await knex.schema.createTable("funding_submission_lines", (table) => {
    table.increments("id").notNullable().primary()
    table.string("fiscal_year", 10).notNullable()
    table.string("section_name", 200).notNullable()
    table.string("line_name", 200).notNullable()
    table.integer("from_age")
    table.integer("to_age")
    table.decimal("monthly_amount", 15, 4).notNullable()
    table.specificType("created_at", "DATETIME2").notNullable().defaultTo(knex.raw("GETUTCDATE()"))
    table.specificType("updated_at", "DATETIME2").notNullable().defaultTo(knex.raw("GETUTCDATE()"))
    table.specificType("deleted_at", "DATETIMEOFFSET")
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("funding_submission_lines")
}
