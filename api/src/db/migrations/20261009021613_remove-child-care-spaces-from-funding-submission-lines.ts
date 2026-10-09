import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  const [unmigratedConfiguration] = await knex.raw<{ id: number }[]>(
    `
      SELECT
        TOP 1 funding_submission_lines.id
      FROM
        funding_submission_lines
      WHERE
        funding_submission_lines.section_name = 'Child Care Spaces'
        AND NOT EXISTS (
          SELECT
            1
          FROM
            child_care_space_categories
          WHERE
            child_care_space_categories.source_funding_submission_line_id = funding_submission_lines.id
        )
    `
  )
  if (unmigratedConfiguration !== undefined) {
    throw new Error(
      `Child Care Spaces configuration ${unmigratedConfiguration.id} has not been migrated.`
    )
  }

  const [unmigratedWorksheet] = await knex.raw<{ id: number }[]>(
    `
      SELECT
        TOP 1 funding_submission_line_jsons.id
      FROM
        funding_submission_line_jsons
        CROSS APPLY OPENJSON (funding_submission_line_jsons.[values]) AS worksheet_lines
      WHERE
        funding_submission_line_jsons.deleted_at IS NULL
        AND JSON_VALUE(worksheet_lines.value, '$.sectionName') = 'Child Care Spaces'
    `
  )
  if (unmigratedWorksheet !== undefined) {
    throw new Error(`Child Care Spaces worksheet ${unmigratedWorksheet.id} has not been migrated.`)
  }

  await knex("funding_submission_lines").where({ section_name: "Child Care Spaces" }).delete()
  await knex.schema.alterTable("child_care_space_categories", (table) => {
    table.dropColumn("source_funding_submission_line_id")
  })
}

export async function down(_knex: Knex): Promise<void> {
  throw new Error("Restoring removed Child Care Spaces configuration requires the original data.")
}
