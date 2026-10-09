import { QueryTypes, sql } from "@sequelize/core"

import { type Migration } from "@/db/umzug"

export async function up({ context: queryInterface }: Migration) {
  const { sequelize } = queryInterface
  const [unmigratedConfiguration] = await sequelize.query<{ id: number }>(
    sql`
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
    `,
    { type: QueryTypes.SELECT }
  )
  if (unmigratedConfiguration !== undefined) {
    throw new Error(
      `Child Care Spaces configuration ${unmigratedConfiguration.id} has not been migrated.`
    )
  }

  const [unmigratedWorksheet] = await sequelize.query<{ id: number }>(
    sql`
      SELECT
        TOP 1 funding_submission_line_jsons.id
      FROM
        funding_submission_line_jsons
        CROSS APPLY OPENJSON (funding_submission_line_jsons.[values]) AS worksheet_lines
      WHERE
        funding_submission_line_jsons.deleted_at IS NULL
        AND JSON_VALUE(worksheet_lines.value, '$.sectionName') = 'Child Care Spaces'
    `,
    { type: QueryTypes.SELECT }
  )
  if (unmigratedWorksheet !== undefined) {
    throw new Error(`Child Care Spaces worksheet ${unmigratedWorksheet.id} has not been migrated.`)
  }

  await sequelize.query(
    sql`
      DELETE FROM funding_submission_lines
      WHERE
        section_name = 'Child Care Spaces'
    `,
    { type: QueryTypes.DELETE }
  )
  await queryInterface.removeColumn(
    "child_care_space_categories",
    "source_funding_submission_line_id"
  )
}

export async function down({ context: _context }: Migration) {
  throw new Error("Restoring removed Child Care Spaces configuration requires the original data.")
}
