import { QueryTypes, sql } from "@sequelize/core"
import Big from "big.js"
import { isNil } from "lodash"

import { type Migration } from "@/db/umzug"

const CHILD_CARE_SPACES_SECTION_NAME = "Child Care Spaces"
const BATCH_SIZE = 1000

type FundingLineValue = {
  submissionLineId?: number
  sectionName?: string
  lineName?: string
  monthlyAmount?: string
  estimatedChildOccupancyRate?: string
  actualChildOccupancyRate?: string
}

type FundingSubmissionLineJson = {
  id: number
  centreId: number
  fiscalYearLegacy: string
  monthNameCapitalized: string
  values: string
}

type ChildCareSpaceAttributes = {
  fundingSubmissionLineId: number
  lineName: string
  monthlyAmount: string
  estimatedChildOccupancyRate: string
  actualChildOccupancyRate: string
  estimatedComputedTotal: string
  actualComputedTotal: string
}

export async function up({ context: { sequelize } }: Migration) {
  let offset = 0

  while (true) {
    const fundingSubmissionLineJsons = await sequelize.query<FundingSubmissionLineJson>(
      sql`
        SELECT
          id,
          centre_id AS centreId,
          fiscal_year AS fiscalYearLegacy,
          date_name AS monthNameCapitalized,
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
      {
        type: QueryTypes.SELECT,
        replacements: {
          offset,
          batchSize: BATCH_SIZE,
        },
      }
    )
    if (fundingSubmissionLineJsons.length === 0) return

    for (const fundingSubmissionLineJson of fundingSubmissionLineJsons) {
      const lines: FundingLineValue[] = JSON.parse(fundingSubmissionLineJson.values)
      const childCareSpaces = lines.filter(
        (line) => line.sectionName === CHILD_CARE_SPACES_SECTION_NAME
      )
      if (childCareSpaces.length === 0) continue

      const fiscalPeriodId = await findFiscalPeriodId(sequelize, fundingSubmissionLineJson)
      if (isNil(fiscalPeriodId)) {
        console.warn(
          `No fiscal period found for ${fundingSubmissionLineJson.fiscalYearLegacy} ${fundingSubmissionLineJson.monthNameCapitalized}; retaining Child Care Spaces JSON values for worksheet ${fundingSubmissionLineJson.id}.`
        )
        continue
      }

      const wereAllLinesMigrated = await migrateChildCareSpaces(
        sequelize,
        fundingSubmissionLineJson.centreId,
        fiscalPeriodId,
        fundingSubmissionLineJson.fiscalYearLegacy,
        childCareSpaces
      )
      if (!wereAllLinesMigrated) continue

      const remainingLines = lines.filter(
        (line) => line.sectionName !== CHILD_CARE_SPACES_SECTION_NAME
      )
      await sequelize.query(
        sql`
          UPDATE funding_submission_line_jsons
          SET
            [values] = :values
          WHERE
            id = :fundingSubmissionLineJsonId
        `,
        {
          type: QueryTypes.UPDATE,
          replacements: {
            fundingSubmissionLineJsonId: fundingSubmissionLineJson.id,
            values: JSON.stringify(remainingLines),
          },
        }
      )
    }

    offset += BATCH_SIZE
  }
}

async function findFiscalPeriodId(
  sequelize: Parameters<typeof up>[0]["context"]["sequelize"],
  fundingSubmissionLineJson: FundingSubmissionLineJson
): Promise<number | undefined> {
  const fiscalYear = fundingSubmissionLineJson.fiscalYearLegacy.replace("/", "-")
  const month = fundingSubmissionLineJson.monthNameCapitalized.toLowerCase()
  const [fiscalPeriod] = await sequelize.query<{ id: number }>(
    sql`
      SELECT
        id
      FROM
        fiscal_periods
      WHERE
        fiscal_year = :fiscalYear
        AND month = :month
        AND deleted_at IS NULL
    `,
    {
      type: QueryTypes.SELECT,
      replacements: {
        fiscalYear,
        month,
      },
    }
  )

  return fiscalPeriod?.id
}

async function migrateChildCareSpaces(
  sequelize: Parameters<typeof up>[0]["context"]["sequelize"],
  centreId: number,
  fiscalPeriodId: number,
  fiscalYearLegacy: string,
  childCareSpaces: FundingLineValue[]
): Promise<boolean> {
  const childCareSpacesAttributes: ChildCareSpaceAttributes[] = []
  const fundingSubmissionLineIds = new Set<number>()

  for (const childCareSpace of childCareSpaces) {
    const childCareSpaceAttributes = attributesForChildCareSpace(childCareSpace)
    if (isNil(childCareSpaceAttributes)) return false

    if (fundingSubmissionLineIds.has(childCareSpaceAttributes.fundingSubmissionLineId)) {
      console.warn(
        `Multiple Child Care Spaces lines reference funding submission line ${childCareSpaceAttributes.fundingSubmissionLineId}; retaining source JSON values.`
      )
      return false
    }

    fundingSubmissionLineIds.add(childCareSpaceAttributes.fundingSubmissionLineId)
    childCareSpacesAttributes.push(childCareSpaceAttributes)
  }

  for (const childCareSpaceAttributes of childCareSpacesAttributes) {
    const fundingSubmissionLineId = childCareSpaceAttributes.fundingSubmissionLineId
    const activeFundingSubmissionLine = await findActiveChildCareSpacesFundingSubmissionLine(
      sequelize,
      fundingSubmissionLineId,
      fiscalYearLegacy
    )
    if (isNil(activeFundingSubmissionLine)) return false
  }

  for (const childCareSpaceAttributes of childCareSpacesAttributes) {
    const existingChildCareSpace = await sequelize.query<{ id: number }>(
      sql`
        SELECT
          id
        FROM
          child_care_spaces
        WHERE
          centre_id = :centreId
          AND fiscal_period_id = :fiscalPeriodId
          AND funding_submission_line_id = :fundingSubmissionLineId
          AND deleted_at IS NULL
      `,
      {
        type: QueryTypes.SELECT,
        replacements: {
          centreId,
          fiscalPeriodId,
          fundingSubmissionLineId: childCareSpaceAttributes.fundingSubmissionLineId,
        },
      }
    )
    if (existingChildCareSpace.length > 0) continue

    await sequelize.query(
      sql`
        INSERT INTO
          child_care_spaces (
            centre_id,
            fiscal_period_id,
            funding_submission_line_id,
            line_name,
            monthly_amount,
            estimated_child_occupancy_rate,
            actual_child_occupancy_rate,
            estimated_computed_total,
            actual_computed_total,
            created_at,
            updated_at
          )
        VALUES
          (
            :centreId,
            :fiscalPeriodId,
            :fundingSubmissionLineId,
            :lineName,
            :monthlyAmount,
            :estimatedChildOccupancyRate,
            :actualChildOccupancyRate,
            :estimatedComputedTotal,
            :actualComputedTotal,
            GETUTCDATE(),
            GETUTCDATE()
          )
      `,
      {
        type: QueryTypes.INSERT,
        replacements: {
          centreId,
          fiscalPeriodId,
          ...childCareSpaceAttributes,
        },
      }
    )
  }

  return true
}

async function findActiveChildCareSpacesFundingSubmissionLine(
  sequelize: Parameters<typeof up>[0]["context"]["sequelize"],
  fundingSubmissionLineId: number,
  fiscalYearLegacy: string
): Promise<number | undefined> {
  const [fundingSubmissionLine] = await sequelize.query<{ id: number }>(
    sql`
      SELECT
        id
      FROM
        funding_submission_lines
      WHERE
        id = :fundingSubmissionLineId
        AND fiscal_year = :fiscalYearLegacy
        AND section_name = :sectionName
        AND deleted_at IS NULL
    `,
    {
      type: QueryTypes.SELECT,
      replacements: {
        fundingSubmissionLineId,
        fiscalYearLegacy,
        sectionName: CHILD_CARE_SPACES_SECTION_NAME,
      },
    }
  )
  if (isNil(fundingSubmissionLine)) {
    console.warn(
      `No active Child Care Spaces funding submission line found for ID ${fundingSubmissionLineId}; retaining source JSON values.`
    )
  }

  return fundingSubmissionLine?.id
}

function attributesForChildCareSpace(
  childCareSpace: FundingLineValue
): ChildCareSpaceAttributes | undefined {
  const {
    submissionLineId: fundingSubmissionLineId,
    lineName,
    monthlyAmount,
    estimatedChildOccupancyRate = "0",
    actualChildOccupancyRate = "0",
  } = childCareSpace
  if (isNil(fundingSubmissionLineId) || isNil(lineName) || isNil(monthlyAmount)) {
    console.warn(
      `Skipping malformed Child Care Spaces line ${JSON.stringify(childCareSpace)}; retaining its source JSON values.`
    )
    return
  }

  try {
    return {
      fundingSubmissionLineId,
      lineName,
      monthlyAmount,
      estimatedChildOccupancyRate,
      actualChildOccupancyRate,
      estimatedComputedTotal: Big(monthlyAmount).mul(estimatedChildOccupancyRate).toFixed(4),
      actualComputedTotal: Big(monthlyAmount).mul(actualChildOccupancyRate).toFixed(4),
    }
  } catch {
    console.warn(
      `Skipping malformed Child Care Spaces line ${JSON.stringify(childCareSpace)}; retaining its source JSON values.`
    )
  }
}

export async function down({ context: _context }: Migration) {
  console.warn(
    "WARNING: This migration is not reversible. Child Care Spaces were moved from funding_submission_line_jsons to child_care_spaces. Rolling back requires manual restoration of the original JSON data."
  )
}
