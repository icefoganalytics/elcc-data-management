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
  estimatedComputedTotal?: string
  actualComputedTotal?: string
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

type ExistingChildCareSpace = Omit<ChildCareSpaceAttributes, "fundingSubmissionLineId">

export async function up({ context: { sequelize } }: Migration) {
  for (let offset = 0; ; offset += BATCH_SIZE) {
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
        throw new Error(
          `No fiscal period found for ${fundingSubmissionLineJson.fiscalYearLegacy} ${fundingSubmissionLineJson.monthNameCapitalized}; cannot migrate Child Care Spaces for worksheet ${fundingSubmissionLineJson.id}.`
        )
      }

      const wereAllLinesMigrated = await migrateChildCareSpaces(
        sequelize,
        fundingSubmissionLineJson.centreId,
        fiscalPeriodId,
        childCareSpaces
      )
      if (!wereAllLinesMigrated) {
        throw new Error(
          `Unable to migrate all Child Care Spaces values for worksheet ${fundingSubmissionLineJson.id}; source values are unresolved or conflict with existing ledger data.`
        )
      }
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
    const fundingSubmissionLine = await findFundingSubmissionLine(
      sequelize,
      fundingSubmissionLineId
    )
    if (isNil(fundingSubmissionLine)) return false
  }

  const childCareSpacesToInsert: ChildCareSpaceAttributes[] = []

  for (const childCareSpaceAttributes of childCareSpacesAttributes) {
    const [existingChildCareSpace] = await sequelize.query<ExistingChildCareSpace>(
      sql`
        SELECT
          line_name AS lineName,
          monthly_amount AS monthlyAmount,
          estimated_child_occupancy_rate AS estimatedChildOccupancyRate,
          actual_child_occupancy_rate AS actualChildOccupancyRate,
          estimated_computed_total AS estimatedComputedTotal,
          actual_computed_total AS actualComputedTotal
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
    if (isNil(existingChildCareSpace)) {
      childCareSpacesToInsert.push(childCareSpaceAttributes)
      continue
    }

    if (hasMatchingChildCareSpaceAttributes(existingChildCareSpace, childCareSpaceAttributes)) {
      continue
    }

    console.warn(
      `Existing Child Care Space for centre ${centreId}, fiscal period ${fiscalPeriodId}, and funding submission line ${childCareSpaceAttributes.fundingSubmissionLineId} conflicts with the source JSON values; retaining source JSON values.`
    )
    return false
  }

  for (const childCareSpaceAttributes of childCareSpacesToInsert) {
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

function hasMatchingChildCareSpaceAttributes(
  existingChildCareSpace: ExistingChildCareSpace,
  childCareSpaceAttributes: ChildCareSpaceAttributes
): boolean {
  return (
    existingChildCareSpace.lineName === childCareSpaceAttributes.lineName &&
    Big(existingChildCareSpace.monthlyAmount).eq(childCareSpaceAttributes.monthlyAmount) &&
    Big(existingChildCareSpace.estimatedChildOccupancyRate).eq(
      childCareSpaceAttributes.estimatedChildOccupancyRate
    ) &&
    Big(existingChildCareSpace.actualChildOccupancyRate).eq(
      childCareSpaceAttributes.actualChildOccupancyRate
    ) &&
    Big(existingChildCareSpace.estimatedComputedTotal).eq(
      childCareSpaceAttributes.estimatedComputedTotal
    ) &&
    Big(existingChildCareSpace.actualComputedTotal).eq(childCareSpaceAttributes.actualComputedTotal)
  )
}

async function findFundingSubmissionLine(
  sequelize: Parameters<typeof up>[0]["context"]["sequelize"],
  fundingSubmissionLineId: number
): Promise<number | undefined> {
  const [fundingSubmissionLine] = await sequelize.query<{ id: number }>(
    sql`
      SELECT
        id
      FROM
        funding_submission_lines
      WHERE
        id = :fundingSubmissionLineId
    `,
    {
      type: QueryTypes.SELECT,
      replacements: {
        fundingSubmissionLineId,
      },
    }
  )
  if (isNil(fundingSubmissionLine)) {
    console.warn(
      `No funding submission line found for ID ${fundingSubmissionLineId}; retaining source JSON values.`
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
    const monthlyAmountValue = Big(monthlyAmount)
    const estimatedChildOccupancyRateValue = Big(estimatedChildOccupancyRate)
    const actualChildOccupancyRateValue = Big(actualChildOccupancyRate)

    if (
      !monthlyAmountValue.eq(monthlyAmountValue.toFixed(4)) ||
      !estimatedChildOccupancyRateValue.eq(estimatedChildOccupancyRateValue.toFixed(4)) ||
      !actualChildOccupancyRateValue.eq(actualChildOccupancyRateValue.toFixed(4))
    ) {
      console.warn(
        `Child Care Spaces line ${JSON.stringify(childCareSpace)} contains a value that would lose precision in the ledger; retaining its source JSON values.`
      )
      return
    }

    const estimatedComputedTotal = monthlyAmountValue
      .mul(estimatedChildOccupancyRateValue)
      .toFixed(4)
    const actualComputedTotal = monthlyAmountValue.mul(actualChildOccupancyRateValue).toFixed(4)

    if (
      (!isNil(childCareSpace.estimatedComputedTotal) &&
        !Big(childCareSpace.estimatedComputedTotal).eq(estimatedComputedTotal)) ||
      (!isNil(childCareSpace.actualComputedTotal) &&
        !Big(childCareSpace.actualComputedTotal).eq(actualComputedTotal))
    ) {
      console.warn(
        `Child Care Spaces line ${JSON.stringify(childCareSpace)} has computed totals that do not match its source rates; retaining its source JSON values.`
      )
      return
    }

    return {
      fundingSubmissionLineId,
      lineName,
      monthlyAmount,
      estimatedChildOccupancyRate,
      actualChildOccupancyRate,
      estimatedComputedTotal: childCareSpace.estimatedComputedTotal ?? estimatedComputedTotal,
      actualComputedTotal: childCareSpace.actualComputedTotal ?? actualComputedTotal,
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
