import type { Knex } from "knex"

const CHILD_CARE_SPACES_SECTION_NAME = "Child Care Spaces"

export async function up(knex: Knex): Promise<void> {
  const [unresolvedConfiguration] = await knex.raw<{ id: number }[]>(
    `
      SELECT
        TOP 1 funding_submission_lines.id
      FROM
        funding_submission_lines
      WHERE
        funding_submission_lines.section_name = :sectionName
        AND NOT EXISTS (
          SELECT
            1
          FROM
            funding_periods
          WHERE
            funding_submission_lines.fiscal_year = LEFT(funding_periods.fiscal_year, 4) + '/' + RIGHT(funding_periods.fiscal_year, 2)
        )
    `,
    { sectionName: CHILD_CARE_SPACES_SECTION_NAME }
  )
  if (unresolvedConfiguration !== undefined) {
    throw new Error(
      `No funding period found for Child Care Spaces configuration ${unresolvedConfiguration.id}.`
    )
  }

  await knex.raw(
    `
      INSERT INTO
        child_care_space_categories (
          funding_period_id,
          source_funding_submission_line_id,
          category_name,
          from_age,
          to_age,
          monthly_amount,
          created_at,
          updated_at,
          deleted_at
        )
      SELECT
        funding_periods.id,
        funding_submission_lines.id,
        funding_submission_lines.line_name,
        funding_submission_lines.from_age,
        funding_submission_lines.to_age,
        funding_submission_lines.monthly_amount,
        funding_submission_lines.created_at,
        funding_submission_lines.updated_at,
        CASE
          WHEN funding_submission_lines.section_name <> :sectionName
          OR funding_submission_lines.fiscal_year <> LEFT(funding_periods.fiscal_year, 4) + '/' + RIGHT(funding_periods.fiscal_year, 2) THEN COALESCE(funding_submission_lines.deleted_at, GETUTCDATE())
          ELSE funding_submission_lines.deleted_at
        END
      FROM
        funding_submission_lines
        INNER JOIN funding_periods ON (
          funding_submission_lines.section_name = :sectionName
          AND funding_submission_lines.fiscal_year = LEFT(funding_periods.fiscal_year, 4) + '/' + RIGHT(funding_periods.fiscal_year, 2)
        )
        OR EXISTS (
          SELECT
            1
          FROM
            child_care_spaces
            INNER JOIN fiscal_periods ON fiscal_periods.id = child_care_spaces.fiscal_period_id
          WHERE
            child_care_spaces.funding_submission_line_id = funding_submission_lines.id
            AND fiscal_periods.funding_period_id = funding_periods.id
        )
      WHERE
        NOT EXISTS (
          SELECT
            1
          FROM
            child_care_space_categories
          WHERE
            child_care_space_categories.funding_period_id = funding_periods.id
            AND child_care_space_categories.source_funding_submission_line_id = funding_submission_lines.id
        )
    `,
    { sectionName: CHILD_CARE_SPACES_SECTION_NAME }
  )

  await knex.raw(
    `
      UPDATE child_care_spaces
      SET
        category_id = child_care_space_categories.id
      FROM
        child_care_spaces
        INNER JOIN fiscal_periods ON fiscal_periods.id = child_care_spaces.fiscal_period_id
        INNER JOIN child_care_space_categories ON child_care_space_categories.funding_period_id = fiscal_periods.funding_period_id
        AND child_care_space_categories.source_funding_submission_line_id = child_care_spaces.funding_submission_line_id
      WHERE
        child_care_spaces.category_id IS NULL
    `
  )

  const [unresolvedLedgerRow] = await knex.raw<{ id: number }[]>(
    `
      SELECT
        TOP 1 child_care_spaces.id
      FROM
        child_care_spaces
        INNER JOIN fiscal_periods ON fiscal_periods.id = child_care_spaces.fiscal_period_id
      WHERE
        NOT EXISTS (
          SELECT
            1
          FROM
            child_care_space_categories
          WHERE
            child_care_space_categories.id = child_care_spaces.category_id
            AND child_care_space_categories.funding_period_id = fiscal_periods.funding_period_id
            AND child_care_space_categories.source_funding_submission_line_id = child_care_spaces.funding_submission_line_id
        )
    `
  )

  if (unresolvedLedgerRow !== undefined) {
    throw new Error(
      `Unable to resolve the category for Child Care Space ${unresolvedLedgerRow.id}.`
    )
  }
}

export async function down(_knex: Knex): Promise<void> {
  throw new Error("Child Care Spaces category backfill cannot be automatically reversed.")
}
