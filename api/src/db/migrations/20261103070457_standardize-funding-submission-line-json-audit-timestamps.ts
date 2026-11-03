import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    UPDATE funding_submission_line_jsons WITH (TABLOCKX)
    SET deleted_at = SWITCHOFFSET(deleted_at, '+00:00')
    WHERE deleted_at IS NOT NULL
  `)

  await knex.schema.alterTable("funding_submission_line_jsons", (table) => {
    table.timestamp("deleted_at").nullable().alter()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("funding_submission_line_jsons", (table) => {
    table.specificType("deleted_at", "DATETIMEOFFSET").nullable().alter()
  })
}
