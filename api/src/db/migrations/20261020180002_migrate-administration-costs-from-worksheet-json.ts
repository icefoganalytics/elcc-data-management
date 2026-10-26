import Big from "big.js"
import type { Knex } from "knex"
import { isNil, isUndefined } from "lodash"

const ADMINISTRATION_SECTION_NAMES = ["Administration", "Administration (10% of Spaces)"] as const
const KNOWN_WORKSHEET_PROPERTY_NAMES: Record<string, true> = {
  sectionName: true,
  submissionLineId: true,
  lineName: true,
  monthlyAmount: true,
  estimatedChildOccupancyRate: true,
  actualChildOccupancyRate: true,
  estimatedComputedTotal: true,
  actualComputedTotal: true,
  childCareSpaceCategoryId: true,
}
const KNEX_SOURCE_LINE_COLUMN = "source_funding_submission_line_id"

type DateValue = Date | string | null

type FundingPeriod = {
  id: number
  fiscalYear: string
}

type FiscalPeriod = {
  id: number
  fundingPeriodId: number
  fiscalYear: string
  month: string
}

type FundingSubmissionLine = {
  id: number
  fiscalYear: string
  sectionName: string
  lineName: string
  fromAge: number | null
  toAge: number | null
  monthlyAmount: string
  childCareSpaceCategoryId: number | null
  createdAt: DateValue
  updatedAt: DateValue
  deletedAt: DateValue
}
type AdministrationCategorySource = {
  sourceLine: FundingSubmissionLine
  fundingPeriodId: number
}

type ChildCareSpaceCategory = {
  id: number
  fundingPeriodId: number
}

type WorksheetPropertyRow = {
  worksheetId: number
  centreId: number
  fiscalYear: string
  monthName: string
  createdAt: DateValue
  updatedAt: DateValue
  deletedAt: DateValue
  lineIndex: number | null
  propertyName: string
  propertyValue: string | null
  propertyType: number
}

type JsonProperty = {
  value: string | null
  type: number
}

type AdministrationWorksheetLine = {
  worksheetId: number
  centreId: number
  fiscalYear: string
  monthName: string
  createdAt: DateValue
  updatedAt: DateValue
  deletedAt: DateValue
  lineIndex: number
  properties: Map<string, JsonProperty[]>
  submissionLineId: number
}

type AdministrationCategory = {
  id: number
  fundingPeriodId: number
}

type AdministrationCost = {
  centreId: number
  fiscalPeriodId: number
  categoryId: number
  childCareSpaceCategoryId: number | null
  lineName: string
  monthlyAmount: string
  estimatedChildOccupancyRate: string
  actualChildOccupancyRate: string
  estimatedComputedTotal: string
  actualComputedTotal: string
  createdAt: DateValue
  updatedAt: DateValue
  deletedAt: DateValue
}

export async function up(knex: Knex): Promise<void> {
  const worksheetLines = await findAdministrationWorksheetLines(knex)
  const sourceLines = await findFundingSubmissionLines(knex)
  await rejectNonAdministrationReferencesToAdministrationLines(knex, sourceLines)
  const sourceLineById = new Map(sourceLines.map((sourceLine) => [sourceLine.id, sourceLine]))
  const fundingPeriods = await findFundingPeriods(knex)
  const fundingPeriodIdsByFiscalYear = indexFundingPeriodsByFiscalYear(fundingPeriods)
  const categorySourcesByKey = new Map<string, AdministrationCategorySource>()

  for (const sourceLine of sourceLines) {
    if (!isAdministrationSectionName(sourceLine.sectionName)) {
      continue
    }

    const fundingPeriodId = findUniqueFundingPeriodId(
      sourceLine.fiscalYear,
      fundingPeriodIdsByFiscalYear,
      `Administration configuration ${sourceLine.id}`
    )
    categorySourcesByKey.set(categoryKey(sourceLine.id, fundingPeriodId), {
      sourceLine,
      fundingPeriodId,
    })
  }

  for (const worksheetLine of worksheetLines) {
    const sourceLine = sourceLineById.get(worksheetLine.submissionLineId)
    if (isUndefined(sourceLine)) {
      throw new Error(
        `Administration worksheet references missing funding submission line ${worksheetLine.submissionLineId}.`
      )
    }

    const fundingPeriodId = findUniqueFundingPeriodId(
      worksheetLine.fiscalYear,
      fundingPeriodIdsByFiscalYear,
      `Administration worksheet ${worksheetLine.worksheetId}`
    )
    categorySourcesByKey.set(categoryKey(sourceLine.id, fundingPeriodId), {
      sourceLine,
      fundingPeriodId,
    })
  }

  const fiscalPeriods = await findFiscalPeriods(knex)
  const childCareSpaceCategories = await findChildCareSpaceCategories(knex)
  const categories = await migrateAdministrationCategories(
    knex,
    [...categorySourcesByKey.values()],
    fundingPeriods,
    childCareSpaceCategories
  )
  const administrationCosts = buildAdministrationCosts(
    worksheetLines,
    categories,
    fundingPeriods,
    fiscalPeriods,
    childCareSpaceCategories
  )

  await insertAdministrationCosts(knex, administrationCosts)
  await removeAdministrationValuesFromWorksheets(knex)
  await removeAdministrationConfiguration(knex)
}

export async function down(_knex: Knex): Promise<void> {
  throw new Error(
    "Restoring Administration configuration and worksheet JSON requires the original data."
  )
}

async function findAdministrationWorksheetLines(
  knex: Knex
): Promise<AdministrationWorksheetLine[]> {
  const rows = await knex.raw<WorksheetPropertyRow[]>(
    `
      SELECT
        funding_submission_line_jsons.id AS worksheetId,
        funding_submission_line_jsons.centre_id AS centreId,
        funding_submission_line_jsons.fiscal_year AS fiscalYear,
        funding_submission_line_jsons.date_name AS monthName,
        funding_submission_line_jsons.created_at AS createdAt,
        funding_submission_line_jsons.updated_at AS updatedAt,
        funding_submission_line_jsons.deleted_at AS deletedAt,
        TRY_CONVERT(INT, worksheet_lines.[key]) AS lineIndex,
        worksheet_properties.[key] AS propertyName,
        worksheet_properties.value AS propertyValue,
        worksheet_properties.type AS propertyType
      FROM funding_submission_line_jsons
      CROSS APPLY OPENJSON(funding_submission_line_jsons.[values]) AS worksheet_lines
      CROSS APPLY OPENJSON(
        CASE WHEN worksheet_lines.type = 5 THEN worksheet_lines.value ELSE N'{}' END
      ) AS worksheet_properties
      WHERE EXISTS (
        SELECT 1
        FROM OPENJSON(
          CASE WHEN worksheet_lines.type = 5 THEN worksheet_lines.value ELSE N'{}' END
        ) AS section_properties
        WHERE section_properties.[key] COLLATE Latin1_General_100_BIN2 = N'sectionName'
          AND DATALENGTH(section_properties.[key]) = DATALENGTH(N'sectionName')
          AND section_properties.type = 1
          AND (
            (
              section_properties.value COLLATE Latin1_General_100_BIN2 = :administrationSectionName
              COLLATE Latin1_General_100_BIN2
              AND DATALENGTH(section_properties.value) = DATALENGTH(:administrationSectionName)
            )
            OR (
              section_properties.value COLLATE Latin1_General_100_BIN2 = :legacyAdministrationSectionName
              COLLATE Latin1_General_100_BIN2
              AND DATALENGTH(section_properties.value) = DATALENGTH(:legacyAdministrationSectionName)
            )
          )
      )
      ORDER BY
        funding_submission_line_jsons.id,
        TRY_CONVERT(INT, worksheet_lines.[key]),
        worksheet_properties.[key]
    `,
    {
      administrationSectionName: ADMINISTRATION_SECTION_NAMES[0],
      legacyAdministrationSectionName: ADMINISTRATION_SECTION_NAMES[1],
    }
  )

  const linesByKey = new Map<string, AdministrationWorksheetLine>()

  for (const row of rows) {
    if (isNil(row.lineIndex)) {
      throw new Error(`Administration worksheet ${row.worksheetId} is not a JSON array.`)
    }

    const key = `${row.worksheetId}:${row.lineIndex}`
    let worksheetLine = linesByKey.get(key)
    if (isUndefined(worksheetLine)) {
      worksheetLine = {
        worksheetId: row.worksheetId,
        centreId: row.centreId,
        fiscalYear: row.fiscalYear,
        monthName: row.monthName,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        deletedAt: row.deletedAt,
        lineIndex: row.lineIndex,
        properties: new Map(),
        submissionLineId: -1,
      }
      linesByKey.set(key, worksheetLine)
    }

    const properties = worksheetLine.properties.get(row.propertyName) ?? []
    properties.push({
      value: row.propertyValue,
      type: row.propertyType,
    })
    worksheetLine.properties.set(row.propertyName, properties)
  }

  for (const worksheetLine of linesByKey.values()) {
    for (const propertyName of Object.keys(KNOWN_WORKSHEET_PROPERTY_NAMES)) {
      const properties = worksheetLine.properties.get(propertyName) ?? []
      if (properties.length > 1) {
        throw new Error(
          `Administration worksheet ${worksheetLine.worksheetId} line ${worksheetLine.lineIndex} repeats ${propertyName}.`
        )
      }
    }

    const sectionName = requiredStringProperty(worksheetLine, "sectionName")
    if (!isAdministrationSectionName(sectionName)) {
      throw new Error(
        `Administration worksheet ${worksheetLine.worksheetId} line ${worksheetLine.lineIndex} has a conflicting section name.`
      )
    }

    worksheetLine.submissionLineId = requiredNonnegativeIntegerProperty(
      worksheetLine,
      "submissionLineId"
    )
  }

  return [...linesByKey.values()]
}

async function rejectNonAdministrationReferencesToAdministrationLines(
  knex: Knex,
  sourceLines: FundingSubmissionLine[]
): Promise<void> {
  const administrationSourceIds = new Set<string>()
  for (const sourceLine of sourceLines) {
    if (isAdministrationSectionName(sourceLine.sectionName)) {
      administrationSourceIds.add(String(sourceLine.id))
    }
  }
  if (administrationSourceIds.size === 0) return

  const references = await knex.raw<{ worksheetId: number; sourceLineValue: string }[]>(
    `
      SELECT
        funding_submission_line_jsons.id AS worksheetId,
        line_properties.value AS sourceLineValue
      FROM funding_submission_line_jsons
      CROSS APPLY OPENJSON(funding_submission_line_jsons.[values]) AS worksheet_lines
      CROSS APPLY OPENJSON(
        CASE WHEN worksheet_lines.type = 5 THEN worksheet_lines.value ELSE N'{}' END
      ) AS line_properties
      WHERE line_properties.[key] COLLATE Latin1_General_100_BIN2 = N'submissionLineId'
        AND DATALENGTH(line_properties.[key]) = DATALENGTH(N'submissionLineId')
        AND line_properties.type IN (1, 2)
        AND NOT EXISTS (
          SELECT 1
          FROM OPENJSON(
            CASE WHEN worksheet_lines.type = 5 THEN worksheet_lines.value ELSE N'{}' END
          ) AS section_properties
          WHERE section_properties.[key] COLLATE Latin1_General_100_BIN2 = N'sectionName'
            AND DATALENGTH(section_properties.[key]) = DATALENGTH(N'sectionName')
            AND section_properties.type = 1
            AND (
              (
                section_properties.value COLLATE Latin1_General_100_BIN2 =
                  :administrationSectionName COLLATE Latin1_General_100_BIN2
                AND DATALENGTH(section_properties.value) = DATALENGTH(:administrationSectionName)
              )
              OR (
                section_properties.value COLLATE Latin1_General_100_BIN2 =
                  :legacyAdministrationSectionName COLLATE Latin1_General_100_BIN2
                AND DATALENGTH(section_properties.value) =
                  DATALENGTH(:legacyAdministrationSectionName)
              )
            )
        )
    `,
    {
      administrationSectionName: ADMINISTRATION_SECTION_NAMES[0],
      legacyAdministrationSectionName: ADMINISTRATION_SECTION_NAMES[1],
    }
  )
  for (const reference of references) {
    let sourceLineId: Big
    try {
      sourceLineId = Big(reference.sourceLineValue)
    } catch {
      continue
    }

    if (administrationSourceIds.has(sourceLineId.toString())) {
      throw new Error(
        `Administration source ${sourceLineId.toString()} is referenced by non-Administration worksheet ${reference.worksheetId}.`
      )
    }
  }
}

async function findFundingSubmissionLines(knex: Knex): Promise<FundingSubmissionLine[]> {
  return knex.raw<FundingSubmissionLine[]>(
    `
      SELECT
        id,
        fiscal_year AS fiscalYear,
        section_name AS sectionName,
        line_name AS lineName,
        from_age AS fromAge,
        to_age AS toAge,
        CONVERT(VARCHAR(32), monthly_amount) AS monthlyAmount,
        child_care_space_category_id AS childCareSpaceCategoryId,
        created_at AS createdAt,
        updated_at AS updatedAt,
        deleted_at AS deletedAt
      FROM funding_submission_lines
    `
  )
}

async function findFundingPeriods(knex: Knex): Promise<FundingPeriod[]> {
  return knex.raw<FundingPeriod[]>(
    `
      SELECT id, fiscal_year AS fiscalYear
      FROM funding_periods
    `
  )
}

async function findFiscalPeriods(knex: Knex): Promise<FiscalPeriod[]> {
  return knex.raw<FiscalPeriod[]>(
    `
      SELECT
        id,
        funding_period_id AS fundingPeriodId,
        fiscal_year AS fiscalYear,
        month
      FROM fiscal_periods
    `
  )
}

async function findChildCareSpaceCategories(knex: Knex): Promise<ChildCareSpaceCategory[]> {
  return knex.raw<ChildCareSpaceCategory[]>(
    `
      SELECT id, funding_period_id AS fundingPeriodId
      FROM child_care_space_categories
    `
  )
}

async function migrateAdministrationCategories(
  knex: Knex,
  categorySources: AdministrationCategorySource[],
  fundingPeriods: FundingPeriod[],
  childCareSpaceCategories: ChildCareSpaceCategory[]
): Promise<Map<string, AdministrationCategory>> {
  const fundingPeriodById = new Map(fundingPeriods.map((period) => [period.id, period]))
  const childCareCategoryById = new Map(
    childCareSpaceCategories.map((category) => [category.id, category])
  )

  const categoryAttributesByKey = new Map<
    string,
    {
      sourceLine: FundingSubmissionLine
      fundingPeriodId: number
      childCareSpaceCategoryId: number | null
      monthlyAmount: string
      deletedAt: DateValue | Knex.Raw
    }
  >()
  const activeCategoryNames = new Set<string>()

  for (const { sourceLine, fundingPeriodId } of categorySources) {
    const fundingPeriod = fundingPeriodById.get(fundingPeriodId)
    if (isUndefined(fundingPeriod)) {
      throw new Error(
        `Administration source ${sourceLine.id} has no matching funding period ${fundingPeriodId}.`
      )
    }

    const sourceYearMatchesCategoryYear =
      isAdministrationSectionName(sourceLine.sectionName) &&
      normalizeFiscalYear(sourceLine.fiscalYear) === normalizeFiscalYear(fundingPeriod.fiscalYear)
    const isCurrentConfiguration = sourceYearMatchesCategoryYear && isNil(sourceLine.deletedAt)
    const childCareSpaceCategoryId = sourceYearMatchesCategoryYear
      ? sourceLine.childCareSpaceCategoryId
      : null
    if (!isNil(childCareSpaceCategoryId)) {
      const childCareSpaceCategory = childCareCategoryById.get(childCareSpaceCategoryId)
      if (isUndefined(childCareSpaceCategory)) {
        throw new Error(
          `Administration configuration ${sourceLine.id} references missing Child Care Space category ${childCareSpaceCategoryId}.`
        )
      }
      if (childCareSpaceCategory.fundingPeriodId !== fundingPeriodId) {
        throw new Error(
          `Administration configuration ${sourceLine.id} links to a Child Care Space category from another funding period.`
        )
      }
    }

    const monthlyAmount = exactDecimal(
      sourceLine.monthlyAmount,
      `Administration configuration ${sourceLine.id} monthlyAmount`
    )
    let deletedAt: DateValue | Knex.Raw = sourceLine.deletedAt
    if (!isCurrentConfiguration && isNil(deletedAt)) {
      deletedAt = knex.raw("GETUTCDATE()")
    }

    if (isCurrentConfiguration) {
      const uniqueCategoryKey = `${fundingPeriodId}:${sourceLine.lineName}`
      if (activeCategoryNames.has(uniqueCategoryKey)) {
        throw new Error(
          `Administration configuration has duplicate active category ${sourceLine.lineName} for funding period ${fundingPeriodId}.`
        )
      }
      activeCategoryNames.add(uniqueCategoryKey)
    }

    categoryAttributesByKey.set(categoryKey(sourceLine.id, fundingPeriodId), {
      sourceLine,
      fundingPeriodId,
      childCareSpaceCategoryId,
      monthlyAmount,
      deletedAt,
    })
  }

  if (categoryAttributesByKey.size === 0) {
    return new Map()
  }
  const existingCategories = await knex.raw<
    {
      id: number
      fundingPeriodId: number
      childCareSpaceCategoryId: number | null
      sourceFundingSubmissionLineId: number
      categoryName: string
      fromAge: number | null
      toAge: number | null
      monthlyAmount: string
      deletedAt: DateValue
    }[]
  >(
    `
      SELECT
        id,
        funding_period_id AS fundingPeriodId,
        child_care_space_category_id AS childCareSpaceCategoryId,
        source_funding_submission_line_id AS sourceFundingSubmissionLineId,
        category_name AS categoryName,
        from_age AS fromAge,
        to_age AS toAge,
        CONVERT(VARCHAR(32), monthly_amount) AS monthlyAmount,
        deleted_at AS deletedAt
      FROM administration_cost_categories
      WHERE source_funding_submission_line_id IS NOT NULL
    `
  )
  const categoryByKey = new Map(
    existingCategories.map((category) => [
      categoryKey(category.sourceFundingSubmissionLineId, category.fundingPeriodId),
      category,
    ])
  )

  for (const [key, categoryAttributes] of categoryAttributesByKey) {
    const { sourceLine, fundingPeriodId, childCareSpaceCategoryId, monthlyAmount, deletedAt } =
      categoryAttributes
    const existingCategory = categoryByKey.get(key)
    if (!isUndefined(existingCategory)) {
      assertCategoryMatchesSource(existingCategory, categoryAttributes)
      continue
    }

    const [insertedCategory] = await knex("administration_cost_categories")
      .insert({
        funding_period_id: fundingPeriodId,
        child_care_space_category_id: childCareSpaceCategoryId,
        [KNEX_SOURCE_LINE_COLUMN]: sourceLine.id,
        category_name: sourceLine.lineName,
        from_age: sourceLine.fromAge,
        to_age: sourceLine.toAge,
        monthly_amount: monthlyAmount,
        created_at: sourceLine.createdAt,
        updated_at: sourceLine.updatedAt,
        deleted_at: deletedAt,
      })
      .returning<{ id: number }[]>("id")

    if (isUndefined(insertedCategory)) {
      throw new Error(`Unable to migrate Administration category from source ${sourceLine.id}.`)
    }

    categoryByKey.set(key, {
      id: insertedCategory.id,
      fundingPeriodId,
      childCareSpaceCategoryId,
      sourceFundingSubmissionLineId: sourceLine.id,
      categoryName: sourceLine.lineName,
      fromAge: sourceLine.fromAge,
      toAge: sourceLine.toAge,
      monthlyAmount,
      deletedAt: isNil(deletedAt) ? null : (sourceLine.deletedAt ?? new Date()),
    })
  }

  return new Map(
    [...categoryByKey].map(([key, category]) => [
      key,
      {
        id: category.id,
        fundingPeriodId: category.fundingPeriodId,
      },
    ])
  )
}

function assertCategoryMatchesSource(
  existingCategory: {
    fundingPeriodId: number
    childCareSpaceCategoryId: number | null
    categoryName: string
    fromAge: number | null
    toAge: number | null
    monthlyAmount: string
    deletedAt: DateValue
  },
  categoryAttributes: {
    sourceLine: FundingSubmissionLine
    fundingPeriodId: number
    childCareSpaceCategoryId: number | null
    monthlyAmount: string
    deletedAt: DateValue | Knex.Raw
  }
): void {
  const { sourceLine, fundingPeriodId, childCareSpaceCategoryId, monthlyAmount, deletedAt } =
    categoryAttributes
  const shouldBeDeleted = !isNil(deletedAt)
  if (
    existingCategory.fundingPeriodId !== fundingPeriodId ||
    existingCategory.childCareSpaceCategoryId !== childCareSpaceCategoryId ||
    existingCategory.categoryName !== sourceLine.lineName ||
    existingCategory.fromAge !== sourceLine.fromAge ||
    existingCategory.toAge !== sourceLine.toAge ||
    !Big(existingCategory.monthlyAmount).eq(monthlyAmount) ||
    isNil(existingCategory.deletedAt) === shouldBeDeleted
  ) {
    throw new Error(
      `Existing Administration category for source ${sourceLine.id} conflicts with its legacy configuration.`
    )
  }
}

function buildAdministrationCosts(
  worksheetLines: AdministrationWorksheetLine[],
  categories: Map<string, AdministrationCategory>,
  fundingPeriods: FundingPeriod[],
  fiscalPeriods: FiscalPeriod[],
  childCareSpaceCategories: ChildCareSpaceCategory[]
): AdministrationCost[] {
  const fundingPeriodIdsByFiscalYear = indexFundingPeriodsByFiscalYear(fundingPeriods)

  const fiscalPeriodsByFundingPeriodAndMonth = new Map<string, FiscalPeriod[]>()
  for (const fiscalPeriod of fiscalPeriods) {
    const fiscalYear = normalizeFiscalYear(fiscalPeriod.fiscalYear)
    const key = `${fiscalPeriod.fundingPeriodId}:${fiscalYear}:${fiscalPeriod.month.toLowerCase()}`
    const periods = fiscalPeriodsByFundingPeriodAndMonth.get(key) ?? []
    periods.push(fiscalPeriod)
    fiscalPeriodsByFundingPeriodAndMonth.set(key, periods)
  }

  const childCareCategoryIds = new Set(childCareSpaceCategories.map((category) => category.id))
  const activeCostKeys = new Set<string>()
  const administrationCosts: AdministrationCost[] = []

  for (const worksheetLine of worksheetLines) {
    const { worksheetId, lineIndex, submissionLineId } = worksheetLine
    const fundingPeriodId = findUniqueFundingPeriodId(
      worksheetLine.fiscalYear,
      fundingPeriodIdsByFiscalYear,
      `Administration worksheet ${worksheetId}`
    )
    const category = categories.get(categoryKey(submissionLineId, fundingPeriodId))
    if (isUndefined(category)) {
      throw new Error(
        `Administration worksheet ${worksheetId} line ${lineIndex} has no migrated category for source ${submissionLineId} in funding period ${fundingPeriodId}.`
      )
    }
    if (category.fundingPeriodId !== fundingPeriodId) {
      throw new Error(
        `Administration worksheet ${worksheetId} line ${lineIndex} references a category from another funding period.`
      )
    }

    const fiscalYear = normalizeFiscalYear(worksheetLine.fiscalYear)
    const fiscalPeriodKey = `${fundingPeriodId}:${fiscalYear}:${worksheetLine.monthName.toLowerCase()}`
    const matchingFiscalPeriods = fiscalPeriodsByFundingPeriodAndMonth.get(fiscalPeriodKey) ?? []
    if (matchingFiscalPeriods.length !== 1) {
      throw new Error(
        `Administration worksheet ${worksheetId} has ${matchingFiscalPeriods.length} matching fiscal periods for ${worksheetLine.fiscalYear} ${worksheetLine.monthName}.`
      )
    }

    const fiscalPeriod = matchingFiscalPeriods[0]
    const administrationCost = createAdministrationCost(
      worksheetLine,
      category,
      fiscalPeriod.id,
      childCareCategoryIds
    )
    const activeCostKey = `${administrationCost.centreId}:${administrationCost.fiscalPeriodId}:${administrationCost.categoryId}`
    if (isNil(administrationCost.deletedAt) && activeCostKeys.has(activeCostKey)) {
      throw new Error(
        `Administration worksheets contain duplicate active snapshots for centre ${administrationCost.centreId}, fiscal period ${administrationCost.fiscalPeriodId}, and category ${administrationCost.categoryId}.`
      )
    }
    if (isNil(administrationCost.deletedAt)) {
      activeCostKeys.add(activeCostKey)
    }

    administrationCosts.push(administrationCost)
  }

  return administrationCosts
}

function createAdministrationCost(
  worksheetLine: AdministrationWorksheetLine,
  category: AdministrationCategory,
  fiscalPeriodId: number,
  childCareCategoryIds: Set<number>
): AdministrationCost {
  const lineName = requiredStringProperty(worksheetLine, "lineName")
  if (lineName.length > 200) {
    throw new Error(
      `Administration worksheet ${worksheetLine.worksheetId} line ${worksheetLine.lineIndex} has a lineName longer than 200 characters.`
    )
  }

  const monthlyAmount = requiredExactDecimalProperty(worksheetLine, "monthlyAmount")
  const estimatedChildOccupancyRate =
    optionalExactDecimalProperty(worksheetLine, "estimatedChildOccupancyRate", "0") ?? "0"
  const actualChildOccupancyRate =
    optionalExactDecimalProperty(worksheetLine, "actualChildOccupancyRate", "0") ?? "0"
  const estimatedComputedTotal = exactDecimal(
    Big(monthlyAmount).mul(estimatedChildOccupancyRate).toFixed(4),
    `Administration worksheet ${worksheetLine.worksheetId} line ${worksheetLine.lineIndex} estimatedComputedTotal`
  )
  const actualComputedTotal = exactDecimal(
    Big(monthlyAmount).mul(actualChildOccupancyRate).toFixed(4),
    `Administration worksheet ${worksheetLine.worksheetId} line ${worksheetLine.lineIndex} actualComputedTotal`
  )
  const providedEstimatedComputedTotal = optionalExactDecimalProperty(
    worksheetLine,
    "estimatedComputedTotal"
  )
  const providedActualComputedTotal = optionalExactDecimalProperty(
    worksheetLine,
    "actualComputedTotal"
  )

  if (
    (!isUndefined(providedEstimatedComputedTotal) &&
      !Big(providedEstimatedComputedTotal).eq(estimatedComputedTotal)) ||
    (!isUndefined(providedActualComputedTotal) &&
      !Big(providedActualComputedTotal).eq(actualComputedTotal))
  ) {
    throw new Error(
      `Administration worksheet ${worksheetLine.worksheetId} line ${worksheetLine.lineIndex} has computed totals that conflict with its occupancy values.`
    )
  }

  const childCareSpaceCategoryId = optionalChildCareSpaceCategoryId(
    worksheetLine,
    childCareCategoryIds
  )

  return {
    centreId: worksheetLine.centreId,
    fiscalPeriodId,
    categoryId: category.id,
    childCareSpaceCategoryId,
    lineName,
    monthlyAmount,
    estimatedChildOccupancyRate,
    actualChildOccupancyRate,
    estimatedComputedTotal,
    actualComputedTotal,
    createdAt: worksheetLine.createdAt,
    updatedAt: worksheetLine.updatedAt,
    deletedAt: worksheetLine.deletedAt,
  }
}

function optionalChildCareSpaceCategoryId(
  worksheetLine: AdministrationWorksheetLine,
  childCareCategoryIds: Set<number>
): number | null {
  const property = optionalProperty(worksheetLine, "childCareSpaceCategoryId")
  if (isUndefined(property)) {
    return null
  }
  if (property.type === 0) {
    return null
  }

  const childCareSpaceCategoryId = integerFromProperty(
    worksheetLine,
    "childCareSpaceCategoryId",
    property
  )
  if (!childCareCategoryIds.has(childCareSpaceCategoryId)) {
    throw new Error(
      `Administration worksheet ${worksheetLine.worksheetId} line ${worksheetLine.lineIndex} references missing Child Care Space category ${childCareSpaceCategoryId}.`
    )
  }

  return childCareSpaceCategoryId
}

async function insertAdministrationCosts(
  knex: Knex,
  administrationCosts: AdministrationCost[]
): Promise<void> {
  for (const administrationCost of administrationCosts) {
    await knex("administration_costs").insert({
      centre_id: administrationCost.centreId,
      fiscal_period_id: administrationCost.fiscalPeriodId,
      category_id: administrationCost.categoryId,
      child_care_space_category_id: administrationCost.childCareSpaceCategoryId,
      line_name: administrationCost.lineName,
      monthly_amount: administrationCost.monthlyAmount,
      estimated_child_occupancy_rate: administrationCost.estimatedChildOccupancyRate,
      actual_child_occupancy_rate: administrationCost.actualChildOccupancyRate,
      estimated_computed_total: administrationCost.estimatedComputedTotal,
      actual_computed_total: administrationCost.actualComputedTotal,
      created_at: administrationCost.createdAt,
      updated_at: administrationCost.updatedAt,
      deleted_at: administrationCost.deletedAt,
    })
  }
}

async function removeAdministrationValuesFromWorksheets(knex: Knex): Promise<void> {
  await knex.raw(
    `
      UPDATE funding_submission_line_jsons
      SET [values] = COALESCE(
        (
          SELECT
            N'[' + STRING_AGG(
              CONVERT(
                NVARCHAR(MAX),
                CASE
                  WHEN worksheet_lines.type = 0 THEN N'null'
                  WHEN worksheet_lines.type = 1
                    THEN N'"' + STRING_ESCAPE(worksheet_lines.value, 'json') + N'"'
                  ELSE worksheet_lines.value
                END
              ),
              N','
            ) WITHIN GROUP (ORDER BY TRY_CONVERT(INT, worksheet_lines.[key])) + N']'
          FROM OPENJSON(funding_submission_line_jsons.[values]) AS worksheet_lines
          WHERE NOT EXISTS (
            SELECT 1
            FROM OPENJSON(
              CASE WHEN worksheet_lines.type = 5 THEN worksheet_lines.value ELSE N'{}' END
            ) AS section_properties
            WHERE section_properties.[key] COLLATE Latin1_General_100_BIN2 = N'sectionName'
              AND DATALENGTH(section_properties.[key]) = DATALENGTH(N'sectionName')
              AND section_properties.type = 1
              AND (
                (
                  section_properties.value COLLATE Latin1_General_100_BIN2 = :administrationSectionName
                  COLLATE Latin1_General_100_BIN2
                  AND DATALENGTH(section_properties.value) = DATALENGTH(:administrationSectionName)
                )
                OR (
                  section_properties.value COLLATE Latin1_General_100_BIN2 = :legacyAdministrationSectionName
                  COLLATE Latin1_General_100_BIN2
                  AND DATALENGTH(section_properties.value) = DATALENGTH(:legacyAdministrationSectionName)
                )
              )
          )
        ),
        N'[]'
      )
      WHERE EXISTS (
        SELECT 1
        FROM OPENJSON(funding_submission_line_jsons.[values]) AS worksheet_lines
        CROSS APPLY OPENJSON(
          CASE WHEN worksheet_lines.type = 5 THEN worksheet_lines.value ELSE N'{}' END
        ) AS section_properties
        WHERE section_properties.[key] COLLATE Latin1_General_100_BIN2 = N'sectionName'
          AND DATALENGTH(section_properties.[key]) = DATALENGTH(N'sectionName')
          AND section_properties.type = 1
          AND (
            (
              section_properties.value COLLATE Latin1_General_100_BIN2 = :administrationSectionName
              COLLATE Latin1_General_100_BIN2
              AND DATALENGTH(section_properties.value) = DATALENGTH(:administrationSectionName)
            )
            OR (
              section_properties.value COLLATE Latin1_General_100_BIN2 = :legacyAdministrationSectionName
              COLLATE Latin1_General_100_BIN2
              AND DATALENGTH(section_properties.value) = DATALENGTH(:legacyAdministrationSectionName)
            )
          )
      )
    `,
    {
      administrationSectionName: ADMINISTRATION_SECTION_NAMES[0],
      legacyAdministrationSectionName: ADMINISTRATION_SECTION_NAMES[1],
    }
  )

  const [unmigratedWorksheet] = await knex.raw<{ id: number }[]>(
    `
      SELECT TOP 1 funding_submission_line_jsons.id
      FROM funding_submission_line_jsons
      CROSS APPLY OPENJSON(funding_submission_line_jsons.[values]) AS worksheet_lines
      CROSS APPLY OPENJSON(
        CASE WHEN worksheet_lines.type = 5 THEN worksheet_lines.value ELSE N'{}' END
      ) AS section_properties
      WHERE section_properties.[key] COLLATE Latin1_General_100_BIN2 = N'sectionName'
        AND DATALENGTH(section_properties.[key]) = DATALENGTH(N'sectionName')
        AND section_properties.type = 1
        AND (
          (
            section_properties.value COLLATE Latin1_General_100_BIN2 = :administrationSectionName
            COLLATE Latin1_General_100_BIN2
            AND DATALENGTH(section_properties.value) = DATALENGTH(:administrationSectionName)
          )
          OR (
            section_properties.value COLLATE Latin1_General_100_BIN2 = :legacyAdministrationSectionName
            COLLATE Latin1_General_100_BIN2
            AND DATALENGTH(section_properties.value) = DATALENGTH(:legacyAdministrationSectionName)
          )
        )
    `,
    {
      administrationSectionName: ADMINISTRATION_SECTION_NAMES[0],
      legacyAdministrationSectionName: ADMINISTRATION_SECTION_NAMES[1],
    }
  )
  if (!isUndefined(unmigratedWorksheet)) {
    throw new Error(`Administration worksheet ${unmigratedWorksheet.id} has not been migrated.`)
  }
}

async function removeAdministrationConfiguration(knex: Knex): Promise<void> {
  if (await knex.schema.hasColumn("administration_cost_categories", KNEX_SOURCE_LINE_COLUMN)) {
    await knex.schema.alterTable("administration_cost_categories", (table) => {
      table.dropUnique(
        ["funding_period_id", KNEX_SOURCE_LINE_COLUMN],
        "unique_administration_cost_categories_on_funding_period_id_source_funding_submission_line_id"
      )
      table.dropForeign(KNEX_SOURCE_LINE_COLUMN)
      table.dropColumn(KNEX_SOURCE_LINE_COLUMN)
    })
  }

  await knex.raw(
    `
      DELETE FROM funding_submission_lines
      WHERE (
        section_name COLLATE Latin1_General_100_BIN2 = :administrationSectionName
        AND DATALENGTH(section_name) = DATALENGTH(:administrationSectionName)
      )
      OR (
        section_name COLLATE Latin1_General_100_BIN2 = :legacyAdministrationSectionName
        AND DATALENGTH(section_name) = DATALENGTH(:legacyAdministrationSectionName)
      )
    `,
    {
      administrationSectionName: ADMINISTRATION_SECTION_NAMES[0],
      legacyAdministrationSectionName: ADMINISTRATION_SECTION_NAMES[1],
    }
  )
}

function indexFundingPeriodsByFiscalYear(fundingPeriods: FundingPeriod[]): Map<string, number[]> {
  const fundingPeriodIdsByFiscalYear = new Map<string, number[]>()
  for (const fundingPeriod of fundingPeriods) {
    const fiscalYear = normalizeFiscalYear(fundingPeriod.fiscalYear)
    const fundingPeriodIds = fundingPeriodIdsByFiscalYear.get(fiscalYear) ?? []
    fundingPeriodIds.push(fundingPeriod.id)
    fundingPeriodIdsByFiscalYear.set(fiscalYear, fundingPeriodIds)
  }

  return fundingPeriodIdsByFiscalYear
}

function categoryKey(sourceLineId: number, fundingPeriodId: number): string {
  return `${sourceLineId}:${fundingPeriodId}`
}

function findUniqueFundingPeriodId(
  fiscalYear: string,
  fundingPeriodIdsByFiscalYear: Map<string, number[]>,
  sourceDescription: string
): number {
  const normalizedFiscalYear = normalizeFiscalYear(fiscalYear)
  const fundingPeriodIds = fundingPeriodIdsByFiscalYear.get(normalizedFiscalYear) ?? []
  if (fundingPeriodIds.length !== 1) {
    throw new Error(
      `${sourceDescription} has ${fundingPeriodIds.length} matching funding periods for ${fiscalYear}.`
    )
  }

  return fundingPeriodIds[0]
}

function normalizeFiscalYear(fiscalYear: string): string {
  const match = /^(\d{4})[-/](\d{2}|\d{4})$/.exec(fiscalYear)
  if (isNil(match)) {
    throw new Error(`Cannot match Administration data to invalid fiscal year ${fiscalYear}.`)
  }

  const startYear = Number(match[1])
  const endYear = startYear + 1
  if (
    (match[2].length === 2 && match[2] !== String(endYear).slice(-2)) ||
    (match[2].length === 4 && Number(match[2]) !== endYear)
  ) {
    throw new Error(`Cannot match Administration data to invalid fiscal year ${fiscalYear}.`)
  }

  return `${match[1]}-${endYear}`
}

function isAdministrationSectionName(sectionName: string): boolean {
  return ADMINISTRATION_SECTION_NAMES.some((name) => name === sectionName)
}

function optionalProperty(
  worksheetLine: AdministrationWorksheetLine,
  propertyName: string
): JsonProperty | undefined {
  const properties = worksheetLine.properties.get(propertyName) ?? []
  return properties[0]
}

function requiredStringProperty(
  worksheetLine: AdministrationWorksheetLine,
  propertyName: string
): string {
  const property = optionalProperty(worksheetLine, propertyName)
  if (isUndefined(property) || property.type !== 1 || isNil(property.value)) {
    throw new Error(
      `Administration worksheet ${worksheetLine.worksheetId} line ${worksheetLine.lineIndex} has invalid ${propertyName}.`
    )
  }

  return property.value
}

function requiredNonnegativeIntegerProperty(
  worksheetLine: AdministrationWorksheetLine,
  propertyName: string
): number {
  const property = optionalProperty(worksheetLine, propertyName)
  if (isUndefined(property)) {
    throw new Error(
      `Administration worksheet ${worksheetLine.worksheetId} line ${worksheetLine.lineIndex} is missing ${propertyName}.`
    )
  }

  return integerFromProperty(worksheetLine, propertyName, property)
}

function integerFromProperty(
  worksheetLine: AdministrationWorksheetLine,
  propertyName: string,
  property: JsonProperty
): number {
  if (property.type !== 2 || isNil(property.value)) {
    throw new Error(
      `Administration worksheet ${worksheetLine.worksheetId} line ${worksheetLine.lineIndex} has invalid ${propertyName}.`
    )
  }

  let numberValue: Big
  try {
    numberValue = Big(property.value)
  } catch {
    throw new Error(
      `Administration worksheet ${worksheetLine.worksheetId} line ${worksheetLine.lineIndex} has invalid ${propertyName}.`
    )
  }

  if (
    !numberValue.eq(numberValue.round(0, 0)) ||
    numberValue.lt(0) ||
    numberValue.gt(Number.MAX_SAFE_INTEGER)
  ) {
    throw new Error(
      `Administration worksheet ${worksheetLine.worksheetId} line ${worksheetLine.lineIndex} has invalid ${propertyName}.`
    )
  }

  return Number(numberValue.toString())
}

function requiredExactDecimalProperty(
  worksheetLine: AdministrationWorksheetLine,
  propertyName: string
): string {
  const property = optionalProperty(worksheetLine, propertyName)
  if (isUndefined(property)) {
    throw new Error(
      `Administration worksheet ${worksheetLine.worksheetId} line ${worksheetLine.lineIndex} is missing ${propertyName}.`
    )
  }

  return exactDecimalFromProperty(worksheetLine, propertyName, property)
}

function optionalExactDecimalProperty(
  worksheetLine: AdministrationWorksheetLine,
  propertyName: string,
  defaultValue?: string
): string | undefined {
  const property = optionalProperty(worksheetLine, propertyName)
  if (isUndefined(property)) {
    return defaultValue
  }

  return exactDecimalFromProperty(worksheetLine, propertyName, property)
}

function exactDecimalFromProperty(
  worksheetLine: AdministrationWorksheetLine,
  propertyName: string,
  property: JsonProperty
): string {
  if ((property.type !== 1 && property.type !== 2) || isNil(property.value)) {
    throw new Error(
      `Administration worksheet ${worksheetLine.worksheetId} line ${worksheetLine.lineIndex} has invalid ${propertyName}.`
    )
  }

  return exactDecimal(
    property.value,
    `Administration worksheet ${worksheetLine.worksheetId} line ${worksheetLine.lineIndex} ${propertyName}`
  )
}

function exactDecimal(value: string, sourceDescription: string): string {
  let decimalValue: Big
  try {
    decimalValue = Big(value)
  } catch {
    throw new Error(`${sourceDescription} is not a valid decimal.`)
  }

  const fixedValue = decimalValue.toFixed(4)
  if (!decimalValue.eq(fixedValue) || decimalValue.abs().gt("99999999999.9999")) {
    throw new Error(`${sourceDescription} cannot be represented exactly as DECIMAL(15, 4).`)
  }

  return fixedValue
}
