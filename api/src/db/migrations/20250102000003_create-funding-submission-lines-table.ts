import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("funding_submission_lines", (table) => {
    table.increments("id").notNullable().primary()
    table.string("section_name", 100).notNullable()
    table.string("line_name", 100).notNullable()
    table.decimal("from_age", 2, 1)
    table.decimal("to_age", 2, 1)
    table.decimal("monthly_amount", 6, 2)
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
    "CREATE UNIQUE INDEX idx_funding_submission_lines_section_line_unique ON funding_submission_lines (section_name, line_name) WHERE deleted_at IS NULL"
  )
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("funding_submission_lines")
}
