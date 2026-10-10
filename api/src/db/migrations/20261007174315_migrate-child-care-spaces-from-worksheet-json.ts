import type { Knex } from "knex"
import Big from "big.js"
import { isNil } from "lodash"

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

export async function up(knex: Knex): Promise<void> {
  for (let offset = 0; ; offset += BATCH_SIZE) {
    const fundingSubmissionLineJsons = await knex.raw<FundingSubmissionLineJson[]>(
      `
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
      { offset, batchSize: BATCH_SIZE }
    )
    if (fundingSubmissionLineJsons.length === 0) return

    for (const fundingSubmissionLineJson of fundingSubmissionLineJsons) {
      const lines: FundingLineValue[] = JSON.parse(fundingSubmissionLineJson.values)
      const childCareSpaces = lines.filter(
        (line) => line.sectionName === CHILD_CARE_SPACES_SECTION_NAME
      )
      if (childCareSpaces.length === 0) continue

      const fiscalPeriodId = await findFiscalPeriodId(knex, fundingSubmissionLineJson)
      if (isNil(fiscalPeriodId)) {
        throw new Error(
          `No fiscal period found for ${fundingSubmissionLineJson.fiscalYearLegacy} ${fundingSubmissionLineJson.monthNameCapitalized}; cannot migrate Child Care Spaces for worksheet ${fundingSubmissionLineJson.id}.`
        )
      }

      const wereAllLinesMigrated = await migrateChildCareSpaces(
        knex,
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
      await knex("funding_submission_line_jsons")
        .where({ id: fundingSubmissionLineJson.id })
        .update({ values: JSON.stringify(remainingLines) })
    }
  }
}

async function findFiscalPeriodId(
  knex: Knex,
  fundingSubmissionLineJson: FundingSubmissionLineJson
): Promise<number | undefined> {
  const fiscalYear = fundingSubmissionLineJson.fiscalYearLegacy.replace("/", "-")
  const month = fundingSubmissionLineJson.monthNameCapitalized.toLowerCase()
  const [fiscalPeriod] = await knex.raw<{ id: number }[]>(
    `
      SELECT
        id
      FROM
        fiscal_periods
      WHERE
        fiscal_year = :fiscalYear
        AND month = :month
        AND deleted_at IS NULL
    `,
    { fiscalYear, month }
  )

  return fiscalPeriod?.id
}

async function migrateChildCareSpaces(
  knex: Knex,
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
    const fundingSubmissionLine = await findFundingSubmissionLine(knex, fundingSubmissionLineId)
    if (isNil(fundingSubmissionLine)) return false
  }

  const childCareSpacesToInsert: ChildCareSpaceAttributes[] = []

  for (const childCareSpaceAttributes of childCareSpacesAttributes) {
    const [existingChildCareSpace] = await knex.raw<ExistingChildCareSpace[]>(
      `
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
        centreId,
        fiscalPeriodId,
        fundingSubmissionLineId: childCareSpaceAttributes.fundingSubmissionLineId,
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
    await knex("child_care_spaces").insert({
      centre_id: centreId,
      fiscal_period_id: fiscalPeriodId,
      funding_submission_line_id: childCareSpaceAttributes.fundingSubmissionLineId,
      line_name: childCareSpaceAttributes.lineName,
      monthly_amount: childCareSpaceAttributes.monthlyAmount,
      estimated_child_occupancy_rate: childCareSpaceAttributes.estimatedChildOccupancyRate,
      actual_child_occupancy_rate: childCareSpaceAttributes.actualChildOccupancyRate,
      estimated_computed_total: childCareSpaceAttributes.estimatedComputedTotal,
      actual_computed_total: childCareSpaceAttributes.actualComputedTotal,
      created_at: knex.raw("GETUTCDATE()"),
      updated_at: knex.raw("GETUTCDATE()"),
    })
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
  knex: Knex,
  fundingSubmissionLineId: number
): Promise<number | undefined> {
  const [fundingSubmissionLine] = await knex.raw<{ id: number }[]>(
    `
      SELECT
        id
      FROM
        funding_submission_lines
      WHERE
        id = :fundingSubmissionLineId
    `,
    { fundingSubmissionLineId }
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

export async function down(_knex: Knex): Promise<void> {
  console.warn(
    "WARNING: This migration is not reversible. Child Care Spaces were moved from funding_submission_line_jsons to child_care_spaces. Rolling back requires manual restoration of the original JSON data."
  )
}
