import type { Knex } from "knex"

const ADMINISTRATION_SECTION_NAME = "Administration (10% of Spaces)"
const QUALITY_ENHANCEMENT_PROGRAM_SECTION_NAME = "Quality Enhancement Program"
const BATCH_SIZE = 500

type WorksheetRow = {
  id: number
  centreId: number
  fiscalYear: string
  dateName: string
  values: string
}

type HistoricalFundingLineValue = {
  submissionLineId?: number
  sectionName?: string
  childCareSpaceCategoryId?: number
  [key: string]: unknown
}

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("funding_submission_lines", (table) => {
    table.integer("child_care_space_category_id").nullable()
    table
      .foreign("child_care_space_category_id")
      .references("child_care_space_categories.id")
      .onDelete("SET NULL")
  })

  await assertUnambiguousConfigurationMatches(knex)
  await knex.raw(
    `
      UPDATE funding_submission_lines
      SET
        child_care_space_category_id = matching_categories.id
      FROM
        funding_submission_lines
        INNER JOIN funding_periods ON funding_submission_lines.fiscal_year = LEFT(funding_periods.fiscal_year, 4) + '/' + RIGHT(funding_periods.fiscal_year, 2)
        INNER JOIN child_care_space_categories AS matching_categories ON matching_categories.funding_period_id = funding_periods.id
        AND matching_categories.category_name
      COLLATE Latin1_General_100_BIN2 = funding_submission_lines.line_name
      COLLATE Latin1_General_100_BIN2
      AND matching_categories.deleted_at IS NULL
      WHERE
        funding_submission_lines.section_name
      COLLATE Latin1_General_100_BIN2 IN (
        :administration
        COLLATE Latin1_General_100_BIN2,
        :qualityEnhancementProgram
        COLLATE Latin1_General_100_BIN2
      )
      AND funding_submission_lines.deleted_at IS NULL
    `,
    {
      administration: ADMINISTRATION_SECTION_NAME,
      qualityEnhancementProgram: QUALITY_ENHANCEMENT_PROGRAM_SECTION_NAME,
    }
  )
  await backfillHistoricalConfigurationAssociations(knex)
  await backfillWorksheetMetadata(knex)
}

type HistoricalConfigCategoryMatch = {
  submissionLineId: number
  categoryId: number
}

async function backfillHistoricalConfigurationAssociations(knex: Knex) {
  const matches = await knex.raw<HistoricalConfigCategoryMatch[]>(
    `
      SELECT DISTINCT
        funding_submission_lines.id AS submissionLineId,
        child_care_spaces.category_id AS categoryId
      FROM
        funding_submission_line_jsons
        CROSS APPLY OPENJSON (funding_submission_line_jsons.[values]) AS worksheet_lines
        INNER JOIN funding_submission_lines ON funding_submission_lines.id = TRY_CONVERT(
          INT,
          JSON_VALUE(worksheet_lines.value, '$.submissionLineId')
        )
        AND funding_submission_lines.fiscal_year = funding_submission_line_jsons.fiscal_year
        AND funding_submission_lines.section_name
      COLLATE Latin1_General_100_BIN2 IN (
        :administration
        COLLATE Latin1_General_100_BIN2,
        :qualityEnhancementProgram
        COLLATE Latin1_General_100_BIN2
      )
      INNER JOIN funding_periods ON LEFT(funding_periods.fiscal_year, 4) + '/' + RIGHT(funding_periods.fiscal_year, 2) = funding_submission_line_jsons.fiscal_year
      INNER JOIN fiscal_periods ON fiscal_periods.funding_period_id = funding_periods.id
      AND LOWER(fiscal_periods.month) = LOWER(funding_submission_line_jsons.date_name)
      INNER JOIN child_care_spaces ON child_care_spaces.centre_id = funding_submission_line_jsons.centre_id
      AND child_care_spaces.fiscal_period_id = fiscal_periods.id
      AND child_care_spaces.line_name
      COLLATE Latin1_General_100_BIN2 = JSON_VALUE(worksheet_lines.value, '$.lineName')
      COLLATE Latin1_General_100_BIN2
      AND child_care_spaces.deleted_at IS NULL
      INNER JOIN child_care_space_categories ON child_care_space_categories.id = child_care_spaces.category_id
      AND child_care_space_categories.funding_period_id = funding_periods.id
      WHERE
        funding_submission_line_jsons.deleted_at IS NULL
        AND child_care_spaces.category_id IS NOT NULL
        AND JSON_VALUE(worksheet_lines.value, '$.sectionName')
      COLLATE Latin1_General_100_BIN2 = funding_submission_lines.section_name
      COLLATE Latin1_General_100_BIN2
    `,
    {
      administration: ADMINISTRATION_SECTION_NAME,
      qualityEnhancementProgram: QUALITY_ENHANCEMENT_PROGRAM_SECTION_NAME,
    }
  )

  const categoryIdsByLineId = new Map<number, Set<number>>()
  for (const { submissionLineId, categoryId } of matches) {
    const categoryIds = categoryIdsByLineId.get(submissionLineId) ?? new Set<number>()
    categoryIds.add(categoryId)
    categoryIdsByLineId.set(submissionLineId, categoryIds)
  }

  const ambiguousLineId = [...categoryIdsByLineId].find(([, categoryIds]) => categoryIds.size > 1)
  if (ambiguousLineId !== undefined) {
    throw new Error(
      `Funding submission line ${ambiguousLineId[0]} matches multiple historical child care space categories.`
    )
  }

  for (const [submissionLineId, categoryIds] of categoryIdsByLineId) {
    const categoryId = Array.from(categoryIds)[0]
    if (categoryId === undefined) continue

    const [existingAssociation] = await knex.raw<{ categoryId: number | null }[]>(
      `
        SELECT
          child_care_space_category_id AS categoryId
        FROM
          funding_submission_lines
        WHERE
          id = :submissionLineId
      `,
      { submissionLineId }
    )
    if (
      existingAssociation !== undefined &&
      existingAssociation.categoryId !== null &&
      existingAssociation.categoryId !== categoryId
    ) {
      throw new Error(
        `Funding submission line ${submissionLineId} has conflicting canonical and historical child care space category matches.`
      )
    }

    await knex("funding_submission_lines")
      .where({ id: submissionLineId })
      .whereNull("child_care_space_category_id")
      .update({ child_care_space_category_id: categoryId })
  }
}

async function assertUnambiguousConfigurationMatches(knex: Knex) {
  const [ambiguousLine] = await knex.raw<{ id: number }[]>(
    `
      SELECT
        TOP 1 funding_submission_lines.id
      FROM
        funding_submission_lines
      WHERE
        funding_submission_lines.section_name
      COLLATE Latin1_General_100_BIN2 IN (
        :administration
        COLLATE Latin1_General_100_BIN2,
        :qualityEnhancementProgram
        COLLATE Latin1_General_100_BIN2
      )
      AND funding_submission_lines.deleted_at IS NULL
      AND (
        SELECT
          COUNT(DISTINCT child_care_space_categories.id)
        FROM
          funding_periods AS candidate_periods
          INNER JOIN child_care_space_categories ON child_care_space_categories.funding_period_id = candidate_periods.id
        WHERE
          LEFT(candidate_periods.fiscal_year, 4) + '/' + RIGHT(candidate_periods.fiscal_year, 2) = funding_submission_lines.fiscal_year
          AND child_care_space_categories.category_name
        COLLATE Latin1_General_100_BIN2 = funding_submission_lines.line_name
        COLLATE Latin1_General_100_BIN2
        AND child_care_space_categories.deleted_at IS NULL
      ) > 1
    `,
    {
      administration: ADMINISTRATION_SECTION_NAME,
      qualityEnhancementProgram: QUALITY_ENHANCEMENT_PROGRAM_SECTION_NAME,
    }
  )
  if (ambiguousLine !== undefined) {
    throw new Error(
      `Funding submission line ${ambiguousLine.id} matches multiple child care space categories.`
    )
  }
}

async function backfillWorksheetMetadata(knex: Knex) {
  const configCategoryIds = await knex.raw<{ id: number; categoryId: number }[]>(
    `
      SELECT
        id,
        child_care_space_category_id AS categoryId
      FROM
        funding_submission_lines
      WHERE
        child_care_space_category_id IS NOT NULL
    `
  )
  const categoryIdBySubmissionLineId = new Map(
    configCategoryIds.map(({ id, categoryId }) => [id, categoryId])
  )

  for (let offset = 0; ; offset += BATCH_SIZE) {
    const worksheets = await knex.raw<WorksheetRow[]>(
      `
        SELECT
          id,
          centre_id AS centreId,
          fiscal_year AS fiscalYear,
          date_name AS dateName,
          [values]
        FROM
          funding_submission_line_jsons
        WHERE
          deleted_at IS NULL
        ORDER BY
          id
        OFFSET
          :offset ROWS
        FETCH NEXT
          :batchSize ROWS ONLY
      `,
      { offset, batchSize: BATCH_SIZE }
    )
    if (worksheets.length === 0) return

    for (const worksheet of worksheets) {
      const categoriesInMonth = await categoryIdsUsedByCentreMonth(knex, worksheet)
      const values: HistoricalFundingLineValue[] = JSON.parse(worksheet.values)
      let changed = false

      for (const line of values) {
        if (
          line.submissionLineId === undefined ||
          (line.sectionName !== ADMINISTRATION_SECTION_NAME &&
            line.sectionName !== QUALITY_ENHANCEMENT_PROGRAM_SECTION_NAME)
        ) {
          continue
        }

        const categoryId = categoryIdBySubmissionLineId.get(line.submissionLineId)
        if (
          categoryId === undefined ||
          !categoriesInMonth.some((category) => category.categoryId === categoryId)
        ) {
          continue
        }

        line.childCareSpaceCategoryId = categoryId
        changed = true
      }

      if (!changed) continue

      await knex("funding_submission_line_jsons")
        .where({ id: worksheet.id })
        .update({ values: JSON.stringify(values) })
    }
  }
}

type MonthlyCategorySnapshot = {
  categoryId: number
}

async function categoryIdsUsedByCentreMonth(knex: Knex, worksheet: WorksheetRow) {
  return knex.raw<MonthlyCategorySnapshot[]>(
    `
      SELECT DISTINCT
        child_care_spaces.category_id AS categoryId
      FROM
        child_care_spaces
        INNER JOIN fiscal_periods ON fiscal_periods.id = child_care_spaces.fiscal_period_id
        INNER JOIN funding_periods ON funding_periods.id = fiscal_periods.funding_period_id
      WHERE
        child_care_spaces.centre_id = :centreId
        AND LEFT(funding_periods.fiscal_year, 4) + '/' + RIGHT(funding_periods.fiscal_year, 2) = :fiscalYear
        AND LOWER(fiscal_periods.month) = LOWER(:dateName)
        AND child_care_spaces.deleted_at IS NULL
        AND child_care_spaces.category_id IS NOT NULL
    `,
    {
      centreId: worksheet.centreId,
      fiscalYear: worksheet.fiscalYear,
      dateName: worksheet.dateName,
    }
  )
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("funding_submission_lines", (table) => {
    table.dropForeign("child_care_space_category_id")
    table.dropColumn("child_care_space_category_id")
  })
}
