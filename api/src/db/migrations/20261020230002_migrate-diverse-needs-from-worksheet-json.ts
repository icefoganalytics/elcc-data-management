import Big from "big.js"
import type { Knex } from "knex"

const MAX_DECIMAL_15_4 = Big("99999999999.9999")

type SourceConfig = {
  id: number
  fundingPeriodId: number | null
  fiscalYear: string
  categoryName: string
  fromAge: number | null
  toAge: number | null
  monthlyAmount: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

type WorksheetLine = {
  worksheetId: number
  centreId: number
  fiscalYear: string
  monthName: string
  lineIndex: number | null
  sectionCount: number
  submissionLineIdCount: number
  submissionLineIdType: number | null
  submissionLineId: string | null
  lineNameCount: number
  lineNameType: number | null
  lineName: string | null
  monthlyAmountCount: number
  monthlyAmountType: number | null
  monthlyAmount: string | null
  estimatedRateCount: number
  estimatedRateType: number | null
  estimatedRate: string | null
  actualRateCount: number
  actualRateType: number | null
  actualRate: string | null
  estimatedTotalCount: number
  estimatedTotalType: number | null
  estimatedTotal: string | null
  actualTotalCount: number
  actualTotalType: number | null
  actualTotal: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  unknownPropertyCount: number
}

type FiscalPeriodMatch = { worksheetId: number; fundingPeriodId: number; fiscalPeriodId: number }

type Category = {
  id: number
  fundingPeriodId: number
  categoryName: string
  fromAge: number | null
  toAge: number | null
  monthlyAmount: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}
type ResolvedLine = { line: WorksheetLine; period: FiscalPeriodMatch; configuration: SourceConfig }
type ExistingLedger = {
  id: number
  centreId: number
  fiscalPeriodId: number
  categoryId: number
  lineName: string
  monthlyAmount: string
  estimatedRate: string
  actualRate: string
  estimatedTotal: string
  actualTotal: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}
type Ledger = Omit<ExistingLedger, "id"> & { worksheetId: number }

export async function up(knex: Knex): Promise<void> {
  await validateWorksheetDocuments(knex)
  const configurations = await findConfigurations(knex)
  const worksheets = await findWorksheetLines(knex)
  const fiscalPeriods = await findFiscalPeriodMatches(knex, worksheets)
  const resolvedLines = worksheets.map((line): ResolvedLine => {
    validateLine(line)
    const matchingPeriods = fiscalPeriods.filter(
      (candidate) => candidate.worksheetId === line.worksheetId
    )
    if (matchingPeriods.length !== 1) {
      throw new Error(
        `Diverse Needs worksheet ${line.worksheetId} resolves to ${matchingPeriods.length} fiscal periods.`
      )
    }
    const period = matchingPeriods[0]
    if (period === undefined) {
      throw new Error(`Diverse Needs worksheet ${line.worksheetId} has no matching fiscal period.`)
    }
    return {
      line,
      period,
      configuration: findConfiguration(line, period.fundingPeriodId, configurations),
    }
  })
  const categories = await migrateCategories(knex, configurations, resolvedLines)
  const existingRows = await findExistingLedger(knex)
  const ledgerRows = resolvedLines.map(({ line, period, configuration }) => {
    const category = categories.get(categoryKey(configuration.id, period.fundingPeriodId))
    if (category === undefined) {
      throw new Error(`Diverse Needs configuration ${configuration.id} has no migrated category.`)
    }
    return makeLedger(line, period.fiscalPeriodId, category.id)
  })

  await migrateLedger(knex, ledgerRows, existingRows)
  await removeChildrenWithDiverseNeedsFundingRecordsJson(knex)
  await retireConfigurations(knex)
}

export async function down(_knex: Knex): Promise<void> {
  throw new Error(
    "Restoring Diverse Needs configuration and worksheet JSON requires the original data."
  )
}

async function validateWorksheetDocuments(knex: Knex): Promise<void> {
  const invalid = await knex.raw<{ id: number }[]>(`
    SELECT id
    FROM funding_submission_line_jsons
    WHERE (
        ISJSON([values]) <> 1
        OR LEFT(LTRIM(COALESCE([values], N'')), 1) <> N'['
      )
      AND CHARINDEX(N'sectionName', COALESCE([values], N'')) > 0
      AND CHARINDEX(N'Children with Diverse Needs', COALESCE([values], N'')) > 0
  `)
  if (invalid.length > 0) {
    throw new Error(
      `Diverse Needs cannot migrate worksheets with unresolved section data: ${invalid.map((row) => row.id).join(", ")}.`
    )
  }
}

async function findConfigurations(knex: Knex): Promise<SourceConfig[]> {
  return knex.raw<SourceConfig[]>(`
    SELECT
      funding_submission_lines.id,
      funding_periods.id AS fundingPeriodId,
      funding_submission_lines.fiscal_year AS fiscalYear,
      funding_submission_lines.line_name AS categoryName,
      funding_submission_lines.from_age AS fromAge,
      funding_submission_lines.to_age AS toAge,
      CONVERT(NVARCHAR(40), funding_submission_lines.monthly_amount) AS monthlyAmount,
      CONVERT(NVARCHAR(33), funding_submission_lines.created_at, 126) AS createdAt,
      CONVERT(NVARCHAR(33), funding_submission_lines.updated_at, 126) AS updatedAt,
      CONVERT(NVARCHAR(33), funding_submission_lines.deleted_at, 126) AS deletedAt
    FROM funding_submission_lines
    LEFT JOIN funding_periods
      ON funding_submission_lines.fiscal_year COLLATE Latin1_General_100_BIN2
        = LEFT(funding_periods.fiscal_year, 4) + '/' + RIGHT(funding_periods.fiscal_year, 2)
          COLLATE Latin1_General_100_BIN2
      AND DATALENGTH(funding_submission_lines.fiscal_year)
        = DATALENGTH(LEFT(funding_periods.fiscal_year, 4) + '/' + RIGHT(funding_periods.fiscal_year, 2))
    WHERE funding_submission_lines.section_name COLLATE Latin1_General_100_BIN2 = N'Children with Diverse Needs'
      AND DATALENGTH(funding_submission_lines.section_name) = DATALENGTH(N'Children with Diverse Needs')
  `)
}

async function findWorksheetLines(knex: Knex): Promise<WorksheetLine[]> {
  return knex.raw<WorksheetLine[]>(`
    SELECT
      worksheets.id AS worksheetId,
      worksheets.centre_id AS centreId,
      worksheets.fiscal_year AS fiscalYear,
      worksheets.date_name AS monthName,
      TRY_CONVERT(INT, lines.[key]) AS lineIndex,
      (SELECT COUNT(*) FROM OPENJSON(lines.value) p WHERE p.[key] COLLATE Latin1_General_100_BIN2 = N'sectionName' AND DATALENGTH(p.[key]) = DATALENGTH(N'sectionName')) AS sectionCount,
      fields.submissionLineIdCount, fields.submissionLineIdType, fields.submissionLineId,
      fields.lineNameCount, fields.lineNameType, fields.lineName,
      fields.monthlyAmountCount, fields.monthlyAmountType, fields.monthlyAmount,
      fields.estimatedRateCount, fields.estimatedRateType, fields.estimatedRate,
      fields.actualRateCount, fields.actualRateType, fields.actualRate,
      fields.estimatedTotalCount, fields.estimatedTotalType, fields.estimatedTotal,
      fields.actualTotalCount, fields.actualTotalType, fields.actualTotal,
      fields.unknownPropertyCount,
      CONVERT(NVARCHAR(33), worksheets.created_at, 126) AS createdAt,
      CONVERT(NVARCHAR(33), worksheets.updated_at, 126) AS updatedAt,
      CONVERT(NVARCHAR(33), worksheets.deleted_at, 126) AS deletedAt
    FROM funding_submission_line_jsons worksheets
    CROSS APPLY OPENJSON(CASE WHEN ISJSON(worksheets.[values]) = 1 THEN worksheets.[values] ELSE N'[]' END) lines
    OUTER APPLY (
      SELECT
        SUM(CASE WHEN allowed.property_name IS NULL THEN 1 ELSE 0 END) AS unknownPropertyCount,
        COUNT(CASE WHEN [key] COLLATE Latin1_General_100_BIN2 = N'submissionLineId' AND DATALENGTH([key]) = DATALENGTH(N'submissionLineId') THEN 1 END) AS submissionLineIdCount,
        MAX(CASE WHEN [key] COLLATE Latin1_General_100_BIN2 = N'submissionLineId' AND DATALENGTH([key]) = DATALENGTH(N'submissionLineId') THEN type END) AS submissionLineIdType,
        MAX(CASE WHEN [key] COLLATE Latin1_General_100_BIN2 = N'submissionLineId' AND DATALENGTH([key]) = DATALENGTH(N'submissionLineId') THEN value END) AS submissionLineId,
        COUNT(CASE WHEN [key] COLLATE Latin1_General_100_BIN2 = N'lineName' AND DATALENGTH([key]) = DATALENGTH(N'lineName') THEN 1 END) AS lineNameCount,
        MAX(CASE WHEN [key] COLLATE Latin1_General_100_BIN2 = N'lineName' AND DATALENGTH([key]) = DATALENGTH(N'lineName') THEN type END) AS lineNameType,
        MAX(CASE WHEN [key] COLLATE Latin1_General_100_BIN2 = N'lineName' AND DATALENGTH([key]) = DATALENGTH(N'lineName') THEN value END) AS lineName,
        COUNT(CASE WHEN [key] COLLATE Latin1_General_100_BIN2 = N'monthlyAmount' AND DATALENGTH([key]) = DATALENGTH(N'monthlyAmount') THEN 1 END) AS monthlyAmountCount,
        MAX(CASE WHEN [key] COLLATE Latin1_General_100_BIN2 = N'monthlyAmount' AND DATALENGTH([key]) = DATALENGTH(N'monthlyAmount') THEN type END) AS monthlyAmountType,
        MAX(CASE WHEN [key] COLLATE Latin1_General_100_BIN2 = N'monthlyAmount' AND DATALENGTH([key]) = DATALENGTH(N'monthlyAmount') THEN value END) AS monthlyAmount,
        COUNT(CASE WHEN [key] COLLATE Latin1_General_100_BIN2 = N'estimatedChildOccupancyRate' AND DATALENGTH([key]) = DATALENGTH(N'estimatedChildOccupancyRate') THEN 1 END) AS estimatedRateCount,
        MAX(CASE WHEN [key] COLLATE Latin1_General_100_BIN2 = N'estimatedChildOccupancyRate' AND DATALENGTH([key]) = DATALENGTH(N'estimatedChildOccupancyRate') THEN type END) AS estimatedRateType,
        MAX(CASE WHEN [key] COLLATE Latin1_General_100_BIN2 = N'estimatedChildOccupancyRate' AND DATALENGTH([key]) = DATALENGTH(N'estimatedChildOccupancyRate') THEN value END) AS estimatedRate,
        COUNT(CASE WHEN [key] COLLATE Latin1_General_100_BIN2 = N'actualChildOccupancyRate' AND DATALENGTH([key]) = DATALENGTH(N'actualChildOccupancyRate') THEN 1 END) AS actualRateCount,
        MAX(CASE WHEN [key] COLLATE Latin1_General_100_BIN2 = N'actualChildOccupancyRate' AND DATALENGTH([key]) = DATALENGTH(N'actualChildOccupancyRate') THEN type END) AS actualRateType,
        MAX(CASE WHEN [key] COLLATE Latin1_General_100_BIN2 = N'actualChildOccupancyRate' AND DATALENGTH([key]) = DATALENGTH(N'actualChildOccupancyRate') THEN value END) AS actualRate,
        COUNT(CASE WHEN [key] COLLATE Latin1_General_100_BIN2 = N'estimatedComputedTotal' AND DATALENGTH([key]) = DATALENGTH(N'estimatedComputedTotal') THEN 1 END) AS estimatedTotalCount,
        MAX(CASE WHEN [key] COLLATE Latin1_General_100_BIN2 = N'estimatedComputedTotal' AND DATALENGTH([key]) = DATALENGTH(N'estimatedComputedTotal') THEN type END) AS estimatedTotalType,
        MAX(CASE WHEN [key] COLLATE Latin1_General_100_BIN2 = N'estimatedComputedTotal' AND DATALENGTH([key]) = DATALENGTH(N'estimatedComputedTotal') THEN value END) AS estimatedTotal,
        COUNT(CASE WHEN [key] COLLATE Latin1_General_100_BIN2 = N'actualComputedTotal' AND DATALENGTH([key]) = DATALENGTH(N'actualComputedTotal') THEN 1 END) AS actualTotalCount,
        MAX(CASE WHEN [key] COLLATE Latin1_General_100_BIN2 = N'actualComputedTotal' AND DATALENGTH([key]) = DATALENGTH(N'actualComputedTotal') THEN type END) AS actualTotalType,
        MAX(CASE WHEN [key] COLLATE Latin1_General_100_BIN2 = N'actualComputedTotal' AND DATALENGTH([key]) = DATALENGTH(N'actualComputedTotal') THEN value END) AS actualTotal
      FROM OPENJSON(CASE WHEN lines.type = 5 THEN lines.value ELSE N'{}' END) AS property
      LEFT JOIN (
        VALUES (N'sectionName'), (N'submissionLineId'), (N'lineName'), (N'monthlyAmount'),
          (N'estimatedChildOccupancyRate'), (N'actualChildOccupancyRate'),
          (N'estimatedComputedTotal'), (N'actualComputedTotal')
      ) AS allowed(property_name)
        ON property.[key] COLLATE Latin1_General_100_BIN2 = allowed.property_name COLLATE Latin1_General_100_BIN2
        AND DATALENGTH(property.[key]) = DATALENGTH(allowed.property_name)
    ) fields
    WHERE EXISTS (SELECT 1 FROM OPENJSON(CASE WHEN lines.type = 5 THEN lines.value ELSE N'{}' END) section WHERE section.[key] COLLATE Latin1_General_100_BIN2 = N'sectionName' AND DATALENGTH(section.[key]) = DATALENGTH(N'sectionName') AND section.type = 1 AND section.value COLLATE Latin1_General_100_BIN2 = N'Children with Diverse Needs' AND DATALENGTH(section.value) = DATALENGTH(N'Children with Diverse Needs'))
    ORDER BY worksheets.id, TRY_CONVERT(INT, lines.[key])
  `)
}

async function findFiscalPeriodMatches(
  knex: Knex,
  lines: WorksheetLine[]
): Promise<FiscalPeriodMatch[]> {
  if (lines.length === 0) return []
  const worksheets = [...new Set(lines.map((line) => line.worksheetId))]
  const rawRows = await knex.raw<FiscalPeriodMatch[]>(
    `
    SELECT DISTINCT
      TRY_CONVERT(INT, source.value) AS worksheetId,
      funding_periods.id AS fundingPeriodId,
      fiscal_periods.id AS fiscalPeriodId
    FROM OPENJSON(:worksheetIds) source
    JOIN funding_submission_line_jsons worksheets
      ON worksheets.id = TRY_CONVERT(INT, source.value)
    JOIN fiscal_periods ON fiscal_periods.month = worksheets.date_name
      AND CONVERT(DATE, worksheets.date_start) = CONVERT(DATE, fiscal_periods.date_start)
      AND CONVERT(DATE, worksheets.date_end) = CONVERT(DATE, fiscal_periods.date_end)
    JOIN funding_periods ON funding_periods.id = fiscal_periods.funding_period_id
      AND worksheets.fiscal_year COLLATE Latin1_General_100_BIN2
        = LEFT(funding_periods.fiscal_year, 4) + '/' + RIGHT(funding_periods.fiscal_year, 2)
          COLLATE Latin1_General_100_BIN2
      AND DATALENGTH(worksheets.fiscal_year)
        = DATALENGTH(LEFT(funding_periods.fiscal_year, 4) + '/' + RIGHT(funding_periods.fiscal_year, 2))
    `,
    { worksheetIds: JSON.stringify(worksheets) }
  )
  return rawRows
}

async function migrateCategories(
  knex: Knex,
  configurations: SourceConfig[],
  resolvedLines: ResolvedLine[]
): Promise<Map<string, Category>> {
  const fundingPeriods = await knex("funding_periods").select({ id: "id" })
  const periodIds = new Set<number>(fundingPeriods.map((row: { id: number }) => row.id))
  const claimedIds = new Map<string, Set<number>>()
  const result = new Map<string, Category>()

  for (const configuration of configurations) {
    if (configuration.fundingPeriodId === null || !periodIds.has(configuration.fundingPeriodId)) {
      throw new Error(`Diverse Needs configuration ${configuration.id} has no funding period.`)
    }
    validateConfiguration(configuration)

    const targetPeriods = new Set<number>([configuration.fundingPeriodId])
    for (const resolved of resolvedLines) {
      if (resolved.configuration.id === configuration.id) {
        targetPeriods.add(resolved.period.fundingPeriodId)
      }
    }

    for (const fundingPeriodId of targetPeriods) {
      const isHistoricalPeriod = fundingPeriodId !== configuration.fundingPeriodId
      const deletedAt = isHistoricalPeriod
        ? (configuration.deletedAt ?? configuration.updatedAt)
        : configuration.deletedAt
      const claimKey = `${fundingPeriodId}:${configuration.categoryName}:${deletedAt ?? ""}`
      const claimed = claimedIds.get(claimKey) ?? new Set<number>()
      claimedIds.set(claimKey, claimed)
      const matches = await knex.raw<Category[]>(
        `
          SELECT
            id,
            funding_period_id AS fundingPeriodId,
            category_name AS categoryName,
            from_age AS fromAge,
            to_age AS toAge,
            CONVERT(NVARCHAR(40), monthly_amount) AS monthlyAmount,
            CONVERT(NVARCHAR(33), created_at, 126) AS createdAt,
            CONVERT(NVARCHAR(33), updated_at, 126) AS updatedAt,
            CONVERT(NVARCHAR(33), deleted_at, 126) AS deletedAt
          FROM children_with_diverse_needs_funding_categories
          WHERE funding_period_id = :fundingPeriodId
            AND category_name COLLATE Latin1_General_100_BIN2 = :categoryName
            AND DATALENGTH(category_name) = DATALENGTH(:categoryName)
            AND (
              (deleted_at IS NULL AND :deletedAt IS NULL)
              OR deleted_at = CONVERT(DATETIME2, :deletedAt, 126)
            )
          ORDER BY id
        `,
        {
          fundingPeriodId,
          categoryName: configuration.categoryName,
          deletedAt,
        }
      )
      let category = matches.find(
        (candidate) =>
          !claimed.has(candidate.id) &&
          Big(candidate.monthlyAmount).eq(configuration.monthlyAmount) &&
          candidate.fromAge === configuration.fromAge &&
          candidate.toAge === configuration.toAge &&
          candidate.createdAt === configuration.createdAt &&
          candidate.updatedAt === configuration.updatedAt
      )
      if (category === undefined) {
        const [inserted] = await knex("children_with_diverse_needs_funding_categories")
          .insert({
            funding_period_id: fundingPeriodId,
            category_name: configuration.categoryName,
            from_age: configuration.fromAge,
            to_age: configuration.toAge,
            monthly_amount: configuration.monthlyAmount,
            created_at: configuration.createdAt,
            updated_at: configuration.updatedAt,
            deleted_at: deletedAt,
          })
          .returning("id")
        if (inserted === undefined) {
          throw new Error(`Diverse Needs configuration ${configuration.id} could not be migrated.`)
        }
        category = {
          id: inserted.id,
          fundingPeriodId,
          categoryName: configuration.categoryName,
          fromAge: configuration.fromAge,
          toAge: configuration.toAge,
          monthlyAmount: configuration.monthlyAmount,
          createdAt: configuration.createdAt,
          updatedAt: configuration.updatedAt,
          deletedAt,
        }
      }
      claimed.add(category.id)
      result.set(categoryKey(configuration.id, fundingPeriodId), category)
    }
  }
  return result
}

function categoryKey(configurationId: number, fundingPeriodId: number): string {
  return `${configurationId}:${fundingPeriodId}`
}

async function findExistingLedger(knex: Knex): Promise<ExistingLedger[]> {
  return knex.raw<ExistingLedger[]>(
    `SELECT id, centre_id AS centreId, fiscal_period_id AS fiscalPeriodId, category_id AS categoryId, line_name AS lineName, CONVERT(NVARCHAR(40), monthly_amount) AS monthlyAmount, CONVERT(NVARCHAR(40), estimated_child_occupancy_rate) AS estimatedRate, CONVERT(NVARCHAR(40), actual_child_occupancy_rate) AS actualRate, CONVERT(NVARCHAR(40), estimated_computed_total) AS estimatedTotal, CONVERT(NVARCHAR(40), actual_computed_total) AS actualTotal, CONVERT(NVARCHAR(33), created_at, 126) AS createdAt, CONVERT(NVARCHAR(33), updated_at, 126) AS updatedAt, CONVERT(NVARCHAR(33), deleted_at, 126) AS deletedAt FROM children_with_diverse_needs_funding_records`
  )
}

function findConfiguration(
  line: WorksheetLine,
  fundingPeriodId: number,
  configurations: SourceConfig[]
): SourceConfig {
  const matches =
    line.submissionLineId === null
      ? configurations.filter(
          (configuration) =>
            configuration.fundingPeriodId === fundingPeriodId &&
            configuration.categoryName === line.lineName &&
            configuration.deletedAt === null
        )
      : configurations.filter((configuration) => configuration.id === parseConfigurationId(line))
  if (matches.length !== 1) {
    throw new Error(
      `Diverse Needs worksheet ${line.worksheetId} line ${line.lineIndex} has no unique matching configuration.`
    )
  }
  const configuration = matches[0]
  if (configuration === undefined) {
    throw new Error(
      `Diverse Needs worksheet ${line.worksheetId} line ${line.lineIndex} has no matching configuration.`
    )
  }
  return configuration
}

function parseConfigurationId(line: WorksheetLine): number {
  if (line.submissionLineId === null) {
    throw new Error(`Diverse Needs worksheet ${line.worksheetId} has no configuration identifier.`)
  }
  let id: Big
  try {
    id = Big(line.submissionLineId)
  } catch {
    throw new Error(
      `Diverse Needs worksheet ${line.worksheetId} line ${line.lineIndex} has an invalid configuration identifier.`
    )
  }
  if (id.lt(0) || id.gt("2147483647") || !id.eq(id.round(0, Big.roundDown))) {
    throw new Error(
      `Diverse Needs worksheet ${line.worksheetId} line ${line.lineIndex} has an invalid configuration identifier.`
    )
  }
  return Number(id.toFixed(0))
}

function validateLine(line: WorksheetLine): void {
  if (
    line.lineIndex === null ||
    line.lineIndex < 0 ||
    line.sectionCount !== 1 ||
    line.lineNameCount !== 1 ||
    line.lineNameType !== 1 ||
    line.lineName === null ||
    line.lineName.length > 200
  ) {
    throw new Error(
      `Diverse Needs worksheet ${line.worksheetId} line has invalid section, index, or name data.`
    )
  }
  if (line.unknownPropertyCount !== 0) {
    throw new Error(
      `Diverse Needs worksheet ${line.worksheetId} line ${line.lineIndex} contains unsupported historical fields.`
    )
  }
  if (
    line.submissionLineIdCount > 1 ||
    (line.submissionLineIdCount === 1 && line.submissionLineIdType !== 2)
  ) {
    throw new Error(
      `Diverse Needs worksheet ${line.worksheetId} line ${line.lineIndex} has invalid configuration metadata.`
    )
  }
  requireAmount(
    line.monthlyAmountCount,
    line.monthlyAmountType,
    line.monthlyAmount,
    "monthly amount",
    line
  )
  validateOptionalAmount(
    line.estimatedRateCount,
    line.estimatedRateType,
    line.estimatedRate,
    "estimated occupancy",
    line
  )
  validateOptionalAmount(
    line.actualRateCount,
    line.actualRateType,
    line.actualRate,
    "actual occupancy",
    line
  )
  validateOptionalAmount(
    line.estimatedTotalCount,
    line.estimatedTotalType,
    line.estimatedTotal,
    "estimated total",
    line
  )
  validateOptionalAmount(
    line.actualTotalCount,
    line.actualTotalType,
    line.actualTotal,
    "actual total",
    line
  )
}

function validateConfiguration(configuration: SourceConfig): void {
  const amount = decimal(configuration.monthlyAmount)
  if (
    configuration.categoryName.length > 200 ||
    (configuration.fromAge !== null && configuration.fromAge < 0) ||
    (configuration.toAge !== null && configuration.toAge < 0) ||
    (configuration.fromAge !== null &&
      configuration.toAge !== null &&
      configuration.fromAge > configuration.toAge) ||
    amount === null ||
    amount.gt(MAX_DECIMAL_15_4) ||
    !amount.eq(amount.toFixed(4))
  ) {
    throw new Error(`Diverse Needs configuration ${configuration.id} has invalid category facts.`)
  }
}

function makeLedger(line: WorksheetLine, fiscalPeriodId: number, categoryId: number): Ledger {
  const monthlyAmount = requireAmount(
    line.monthlyAmountCount,
    line.monthlyAmountType,
    line.monthlyAmount,
    "monthly amount",
    line
  )
  const estimatedRate =
    line.estimatedRateCount === 0
      ? "0"
      : requireAmount(
          line.estimatedRateCount,
          line.estimatedRateType,
          line.estimatedRate,
          "estimated occupancy",
          line
        )
  const actualRate =
    line.actualRateCount === 0
      ? "0"
      : requireAmount(
          line.actualRateCount,
          line.actualRateType,
          line.actualRate,
          "actual occupancy",
          line
        )
  const estimatedTotal =
    line.estimatedTotalCount === 0
      ? Big(monthlyAmount).mul(estimatedRate).toFixed(4)
      : requireAmount(
          line.estimatedTotalCount,
          line.estimatedTotalType,
          line.estimatedTotal,
          "estimated total",
          line
        )
  const actualTotal =
    line.actualTotalCount === 0
      ? Big(monthlyAmount).mul(actualRate).toFixed(4)
      : requireAmount(
          line.actualTotalCount,
          line.actualTotalType,
          line.actualTotal,
          "actual total",
          line
        )
  if (line.lineName === null) {
    throw new Error(`Diverse Needs worksheet ${line.worksheetId} has no line name.`)
  }
  return {
    worksheetId: line.worksheetId,
    centreId: line.centreId,
    fiscalPeriodId,
    categoryId,
    lineName: line.lineName,
    monthlyAmount,
    estimatedRate,
    actualRate,
    estimatedTotal,
    actualTotal,
    createdAt: line.createdAt,
    updatedAt: line.updatedAt,
    deletedAt: line.deletedAt,
  }
}

function requireAmount(
  count: number,
  type: number | null,
  value: string | null,
  label: string,
  line: WorksheetLine
): string {
  if (count !== 1 || (type !== 1 && type !== 2 && type !== 3) || value === null) {
    throw new Error(
      `Diverse Needs worksheet ${line.worksheetId} line ${line.lineIndex} has invalid ${label}.`
    )
  }
  const parsed = decimal(value)
  if (parsed === null || parsed.gt(MAX_DECIMAL_15_4) || !parsed.eq(parsed.toFixed(4))) {
    throw new Error(
      `Diverse Needs worksheet ${line.worksheetId} line ${line.lineIndex} has out-of-range ${label}.`
    )
  }
  return value
}

function validateOptionalAmount(
  count: number,
  type: number | null,
  value: string | null,
  label: string,
  line: WorksheetLine
): void {
  if (count === 0) return
  requireAmount(count, type, value, label, line)
}

function decimal(value: string): Big | null {
  try {
    return Big(value)
  } catch {
    return null
  }
}

async function migrateLedger(
  knex: Knex,
  rows: Ledger[],
  existingRows: ExistingLedger[]
): Promise<void> {
  const seenKeys = new Set<string>()
  for (const row of rows) {
    const key = `${row.centreId}:${row.fiscalPeriodId}:${row.categoryId}`
    if (seenKeys.has(key)) {
      throw new Error(
        `Diverse Needs worksheet ${row.worksheetId} repeats a centre, fiscal period, and category.`
      )
    }
    seenKeys.add(key)
    const matches = existingRows.filter(
      (existing) =>
        existing.centreId === row.centreId &&
        existing.fiscalPeriodId === row.fiscalPeriodId &&
        existing.categoryId === row.categoryId
    )
    if (matches.length > 1) {
      throw new Error(
        `Diverse Needs worksheet ${row.worksheetId} resolves to multiple existing ledger rows.`
      )
    }
    const existing = matches[0]
    const attributes = {
      centre_id: row.centreId,
      fiscal_period_id: row.fiscalPeriodId,
      category_id: row.categoryId,
      line_name: row.lineName,
      monthly_amount: row.monthlyAmount,
      estimated_child_occupancy_rate: row.estimatedRate,
      actual_child_occupancy_rate: row.actualRate,
      estimated_computed_total: row.estimatedTotal,
      actual_computed_total: row.actualTotal,
      created_at: row.createdAt,
      updated_at: row.updatedAt,
      deleted_at: row.deletedAt,
    }
    if (existing === undefined) {
      await knex("children_with_diverse_needs_funding_records").insert(attributes)
      continue
    }
    if (
      existing.deletedAt !== row.deletedAt ||
      !Big(existing.monthlyAmount).eq(row.monthlyAmount) ||
      !Big(existing.estimatedRate).eq(row.estimatedRate) ||
      !Big(existing.actualRate).eq(row.actualRate) ||
      !Big(existing.estimatedTotal).eq(row.estimatedTotal) ||
      !Big(existing.actualTotal).eq(row.actualTotal) ||
      existing.lineName !== row.lineName ||
      existing.createdAt !== row.createdAt ||
      existing.updatedAt !== row.updatedAt
    ) {
      throw new Error(
        `Diverse Needs worksheet ${row.worksheetId} conflicts with existing ledger row ${existing.id}.`
      )
    }
  }
}

async function removeChildrenWithDiverseNeedsFundingRecordsJson(knex: Knex): Promise<void> {
  const invalid = await knex.raw<{ worksheetId: number }[]>(`
    SELECT worksheets.id AS worksheetId
    FROM funding_submission_line_jsons worksheets
    CROSS APPLY OPENJSON(CASE WHEN ISJSON(worksheets.[values]) = 1 THEN worksheets.[values] ELSE N'[]' END) lines
    WHERE EXISTS (SELECT 1 FROM OPENJSON(CASE WHEN lines.type = 5 THEN lines.value ELSE N'{}' END) p WHERE p.[key] COLLATE Latin1_General_100_BIN2 = N'sectionName' AND DATALENGTH(p.[key]) = DATALENGTH(N'sectionName') AND p.type = 1 AND p.value COLLATE Latin1_General_100_BIN2 = N'Children with Diverse Needs' AND DATALENGTH(p.value) = DATALENGTH(N'Children with Diverse Needs'))
      AND lines.type <> 5
  `)
  if (invalid.length > 0)
    throw new Error(
      `Diverse Needs worksheets contain unresolved non-object section rows: ${invalid.map((row) => row.worksheetId).join(", ")}.`
    )
  await knex.raw(`
    UPDATE worksheets
    SET [values] = CASE WHEN retained.remainingValues IS NULL THEN N'[]' ELSE N'[' + retained.remainingValues + N']' END
    FROM funding_submission_line_jsons worksheets
    CROSS APPLY (
      SELECT STRING_AGG(
        CONVERT(
          NVARCHAR(MAX),
          CASE
            WHEN lines.type = 0 THEN N'null'
            WHEN lines.type = 1 THEN N'"' + STRING_ESCAPE(lines.value, 'json') + N'"'
            ELSE lines.value
          END
        ),
        N','
      ) WITHIN GROUP (ORDER BY TRY_CONVERT(INT, lines.[key])) AS remainingValues
      FROM OPENJSON(CASE WHEN ISJSON(worksheets.[values]) = 1 THEN worksheets.[values] ELSE N'[]' END) lines
      WHERE NOT EXISTS (SELECT 1 FROM OPENJSON(CASE WHEN lines.type = 5 THEN lines.value ELSE N'{}' END) p WHERE p.[key] COLLATE Latin1_General_100_BIN2 = N'sectionName' AND DATALENGTH(p.[key]) = DATALENGTH(N'sectionName') AND p.type = 1 AND p.value COLLATE Latin1_General_100_BIN2 = N'Children with Diverse Needs' AND DATALENGTH(p.value) = DATALENGTH(N'Children with Diverse Needs'))
    ) retained
    WHERE EXISTS (SELECT 1 FROM OPENJSON(CASE WHEN ISJSON(worksheets.[values]) = 1 THEN worksheets.[values] ELSE N'[]' END) lines WHERE EXISTS (SELECT 1 FROM OPENJSON(CASE WHEN lines.type = 5 THEN lines.value ELSE N'{}' END) p WHERE p.[key] COLLATE Latin1_General_100_BIN2 = N'sectionName' AND DATALENGTH(p.[key]) = DATALENGTH(N'sectionName') AND p.type = 1 AND p.value COLLATE Latin1_General_100_BIN2 = N'Children with Diverse Needs' AND DATALENGTH(p.value) = DATALENGTH(N'Children with Diverse Needs')))
  `)
}

async function retireConfigurations(knex: Knex): Promise<void> {
  await knex("funding_submission_lines")
    .whereRaw(
      "section_name COLLATE Latin1_General_100_BIN2 = N'Children with Diverse Needs' AND DATALENGTH(section_name) = DATALENGTH(N'Children with Diverse Needs')"
    )
    .del()
}
