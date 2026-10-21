import Big from "big.js"
import type { Knex } from "knex"

const SECTION_NAME = "Quality Enhancement Program"
const MAX_DECIMAL_15_4 = Big("99999999999.9999")

type FundingPeriod = {
  id: number
  fiscalYear: string
}

type SpaceCategory = {
  id: number
  fundingPeriodId: number
  categoryName: string
  deletedAt: string | null
}

type SourceConfiguration = {
  id: number
  fiscalYear: string
  fundingPeriodId: number | null
  categoryName: string
  fromAge: number | null
  toAge: number | null
  monthlyAmount: string
  childCareSpaceCategoryId: number | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

type ExistingCategory = {
  id: number
  fundingPeriodId: number
  categoryName: string
  fromAge: number | null
  toAge: number | null
  monthlyAmount: string
  childCareSpaceCategoryId: number | null
  deletedAt: string | null
}

type WorksheetEnhancement = {
  worksheetId: number
  centreId: number
  fiscalYear: string
  monthName: string
  lineIndex: number | null
  sectionNameCount: number
  sectionNameType: number | null
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
  childCareSpaceCategoryIdCount: number
  childCareSpaceCategoryIdType: number | null
  childCareSpaceCategoryId: string | null
  metadataCount: number
  metadataType: number | null
  unknownMetadataPropertyCount: number
  preEnhancementAmountCount: number
  preEnhancementAmountType: number | null
  preEnhancementAmount: string | null
  hotMealCount: number
  hotMealType: number | null
  hotMealPropertyCount: number
  unknownHotMealPropertyCount: number
  hotMealAmountCount: number
  hotMealAmountType: number | null
  hotMealAmount: string | null
  hotMealAppliedAtCount: number
  hotMealAppliedAtType: number | null
  hotMealAppliedAt: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

type FiscalPeriodMatch = {
  worksheetId: number
  fundingPeriodId: number
  fiscalPeriodId: number
}

type ExistingEnhancement = {
  id: number
  centreId: number
  fiscalPeriodId: number
  categoryId: number
  childCareSpaceCategoryId: number | null
  lineName: string
  baseMonthlyAmount: string
  hotMealIncrementAmount: string
  hotMealAppliedAt: string | null
  monthlyAmount: string
  estimatedRate: string
  actualRate: string
  estimatedTotal: string
  actualTotal: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

type LedgerAttributes = Omit<ExistingEnhancement, "id"> & {
  worksheetId: number
}

export async function up(knex: Knex): Promise<void> {
  const fundingPeriods = await findFundingPeriods(knex)
  const spaceCategories = await findSpaceCategories(knex)
  const sourceConfigurations = await findSourceConfigurations(knex, fundingPeriods)
  const existingCategories = await findExistingCategories(knex)
  const categoryIdsBySourceLineId = await migrateConfigurations(
    knex,
    sourceConfigurations,
    spaceCategories,
    existingCategories
  )

  const worksheetEnhancements = await findWorksheetEnhancements(knex)
  if (worksheetEnhancements.length === 0) {
    await retireSourceConfigurations(knex)
    return
  }

  const fiscalPeriods = await findFiscalPeriodMatches(knex, worksheetEnhancements)
  const existingEnhancements = await findExistingEnhancements(knex)
  const ledgerRows = worksheetEnhancements.map((worksheetEnhancement) => {
    validateWorksheetLine(worksheetEnhancement)

    const fiscalPeriod = findFiscalPeriod(fiscalPeriods, worksheetEnhancement)
    const sourceConfiguration = findSourceConfiguration(
      worksheetEnhancement,
      fiscalPeriod.fundingPeriodId,
      sourceConfigurations
    )
    const categoryId = categoryIdsBySourceLineId.get(sourceConfiguration.id)
    if (categoryId === undefined) {
      throw new Error(
        `Quality Enhancement Program worksheet ${worksheetEnhancement.worksheetId} line ${worksheetEnhancement.lineIndex} has no migrated category.`
      )
    }

    return ledgerAttributesFor(
      worksheetEnhancement,
      fiscalPeriod.fundingPeriodId,
      fiscalPeriod.fiscalPeriodId,
      categoryId,
      sourceConfiguration,
      spaceCategories
    )
  })

  await migrateLedgerRows(knex, ledgerRows, existingEnhancements)
  await removeQualityEnhancementJson(knex)
  await retireSourceConfigurations(knex)
}

async function findFundingPeriods(knex: Knex): Promise<FundingPeriod[]> {
  return knex.raw<FundingPeriod[]>(`
    SELECT
      id,
      fiscal_year AS fiscalYear
    FROM funding_periods
  `)
}

async function findSpaceCategories(knex: Knex): Promise<SpaceCategory[]> {
  const spaceCategories = await knex.raw<SpaceCategory[]>(`
    SELECT
      id,
      funding_period_id AS fundingPeriodId,
      category_name AS categoryName,
      CONVERT(NVARCHAR(33), deleted_at, 126) AS deletedAt
    FROM child_care_space_categories
  `)
  return spaceCategories
}

async function findSourceConfigurations(
  knex: Knex,
  fundingPeriods: FundingPeriod[]
): Promise<SourceConfiguration[]> {
  const configurations = await knex.raw<SourceConfiguration[]>(
    `
    SELECT
      funding_submission_lines.id,
      funding_submission_lines.fiscal_year AS fiscalYear,
      funding_periods.id AS fundingPeriodId,
      funding_submission_lines.line_name AS categoryName,
      funding_submission_lines.from_age AS fromAge,
      funding_submission_lines.to_age AS toAge,
      CONVERT(NVARCHAR(40), funding_submission_lines.monthly_amount) AS monthlyAmount,
      funding_submission_lines.child_care_space_category_id AS childCareSpaceCategoryId,
      CONVERT(NVARCHAR(33), funding_submission_lines.created_at, 126) AS createdAt,
      CONVERT(NVARCHAR(33), funding_submission_lines.updated_at, 126) AS updatedAt,
      CONVERT(
        NVARCHAR(33),
        CONVERT(DATETIME2(7), SWITCHOFFSET(funding_submission_lines.deleted_at, '+00:00')),
        126
      ) AS deletedAt
    FROM funding_submission_lines
    LEFT JOIN funding_periods
      ON funding_submission_lines.fiscal_year
        COLLATE Latin1_General_100_BIN2
        = LEFT(funding_periods.fiscal_year, 4) + '/' + RIGHT(funding_periods.fiscal_year, 2)
        COLLATE Latin1_General_100_BIN2
      AND DATALENGTH(funding_submission_lines.fiscal_year)
        = DATALENGTH(LEFT(funding_periods.fiscal_year, 4) + '/' + RIGHT(funding_periods.fiscal_year, 2))
    WHERE funding_submission_lines.section_name COLLATE Latin1_General_100_BIN2 = :sectionName
      AND DATALENGTH(funding_submission_lines.section_name) = DATALENGTH(:sectionName)
    ORDER BY funding_submission_lines.id
  `,
    { sectionName: SECTION_NAME }
  )

  for (const configuration of configurations) {
    const matchedFundingPeriods = fundingPeriods.filter(
      (fundingPeriod) => legacyFiscalYear(fundingPeriod.fiscalYear) === configuration.fiscalYear
    )
    if (matchedFundingPeriods.length !== 1) {
      throw new Error(
        `Quality Enhancement Program configuration ${configuration.id} resolves to ${matchedFundingPeriods.length} funding periods.`
      )
    }
    configuration.fundingPeriodId = matchedFundingPeriods[0].id
  }

  return configurations
}

async function findExistingCategories(knex: Knex): Promise<ExistingCategory[]> {
  const existingCategories = await knex.raw<ExistingCategory[]>(`
    SELECT
      id,
      funding_period_id AS fundingPeriodId,
      category_name AS categoryName,
      from_age AS fromAge,
      to_age AS toAge,
      CONVERT(NVARCHAR(40), monthly_amount) AS monthlyAmount,
      child_care_space_category_id AS childCareSpaceCategoryId,
      CONVERT(NVARCHAR(33), deleted_at, 126) AS deletedAt
    FROM quality_enhancement_categories
  `)
  return existingCategories
}

async function migrateConfigurations(
  knex: Knex,
  sourceConfigurations: SourceConfiguration[],
  spaceCategories: SpaceCategory[],
  existingCategories: ExistingCategory[]
): Promise<Map<number, number>> {
  const categoryIdsBySourceLineId = new Map<number, number>()

  for (const sourceConfiguration of sourceConfigurations) {
    const fundingPeriodId = sourceConfiguration.fundingPeriodId
    if (fundingPeriodId === null) {
      throw new Error(
        `Quality Enhancement Program configuration ${sourceConfiguration.id} has no funding period.`
      )
    }

    const childCareSpaceCategoryId = findConfigurationSpaceCategoryId(
      sourceConfiguration,
      fundingPeriodId,
      spaceCategories
    )
    const monthlyAmount = decimalForDatabase(
      sourceConfiguration.monthlyAmount,
      `configuration ${sourceConfiguration.id} monthly amount`
    )
    validateAgeRange(sourceConfiguration)

    const category = {
      fundingPeriodId,
      categoryName: sourceConfiguration.categoryName,
      fromAge: sourceConfiguration.fromAge,
      toAge: sourceConfiguration.toAge,
      monthlyAmount,
      childCareSpaceCategoryId,
      deletedAt: sourceConfiguration.deletedAt,
    }
    const existing = existingCategories.filter(
      (candidate) =>
        candidate.fundingPeriodId === fundingPeriodId &&
        candidate.categoryName === sourceConfiguration.categoryName
    )

    let categoryId: number
    if (existing.length === 1) {
      if (!categoryMatches(existing[0], category)) {
        throw new Error(
          `Quality Enhancement Program configuration ${sourceConfiguration.id} conflicts with existing category ${existing[0].id}.`
        )
      }
      categoryId = existing[0].id
    } else if (existing.length > 1) {
      throw new Error(
        `Quality Enhancement Program configuration ${sourceConfiguration.id} matches multiple existing categories.`
      )
    } else {
      const [insertedCategory] = await knex("quality_enhancement_categories")
        .insert({
          funding_period_id: fundingPeriodId,
          category_name: sourceConfiguration.categoryName,
          from_age: sourceConfiguration.fromAge,
          to_age: sourceConfiguration.toAge,
          monthly_amount: monthlyAmount,
          child_care_space_category_id: childCareSpaceCategoryId,
          created_at: sourceConfiguration.createdAt,
          updated_at: sourceConfiguration.updatedAt,
          deleted_at: sourceConfiguration.deletedAt,
        })
        .returning<{ id: number }[]>("id")
      if (insertedCategory === undefined) {
        throw new Error(
          `Quality Enhancement Program configuration ${sourceConfiguration.id} could not be migrated.`
        )
      }
      categoryId = insertedCategory.id
    }

    categoryIdsBySourceLineId.set(sourceConfiguration.id, categoryId)
  }

  return categoryIdsBySourceLineId
}

function findConfigurationSpaceCategoryId(
  sourceConfiguration: SourceConfiguration,
  fundingPeriodId: number,
  spaceCategories: SpaceCategory[]
): number | null {
  if (sourceConfiguration.childCareSpaceCategoryId !== null) {
    const linkedCategory = spaceCategories.find(
      (category) => category.id === sourceConfiguration.childCareSpaceCategoryId
    )
    if (linkedCategory === undefined || linkedCategory.fundingPeriodId !== fundingPeriodId) {
      throw new Error(
        `Quality Enhancement Program configuration ${sourceConfiguration.id} links to a child care space category outside its funding period.`
      )
    }
    return linkedCategory.id
  }

  const matchingCategories = spaceCategories.filter(
    (category) =>
      category.fundingPeriodId === fundingPeriodId &&
      category.categoryName === sourceConfiguration.categoryName
  )
  const activeMatches = matchingCategories.filter((category) => category.deletedAt === null)
  if (activeMatches.length === 1) {
    return activeMatches[0].id
  }
  if (activeMatches.length > 1 || (activeMatches.length === 0 && matchingCategories.length > 1)) {
    throw new Error(
      `Quality Enhancement Program configuration ${sourceConfiguration.id} has an ambiguous child care space category label.`
    )
  }
  return matchingCategories[0]?.id ?? null
}

function categoryMatches(
  existing: ExistingCategory,
  expected: Omit<ExistingCategory, "id">
): boolean {
  return (
    existing.fromAge === expected.fromAge &&
    existing.toAge === expected.toAge &&
    Big(existing.monthlyAmount).eq(expected.monthlyAmount) &&
    existing.childCareSpaceCategoryId === expected.childCareSpaceCategoryId &&
    sameDate(existing.deletedAt, expected.deletedAt)
  )
}

function validateAgeRange(configuration: SourceConfiguration): void {
  if (
    configuration.fromAge !== null &&
    configuration.toAge !== null &&
    configuration.fromAge > configuration.toAge
  ) {
    throw new Error(
      `Quality Enhancement Program configuration ${configuration.id} has an invalid age range.`
    )
  }
}

async function findWorksheetEnhancements(knex: Knex): Promise<WorksheetEnhancement[]> {
  return knex.raw<WorksheetEnhancement[]>(
    `
    SELECT
      funding_submission_line_jsons.id AS worksheetId,
      funding_submission_line_jsons.centre_id AS centreId,
      funding_submission_line_jsons.fiscal_year AS fiscalYear,
      funding_submission_line_jsons.date_name AS monthName,
      TRY_CONVERT(INT, worksheet_lines.[key]) AS lineIndex,
      line_fields.sectionNameCount,
      line_fields.sectionNameType,
      line_fields.submissionLineIdCount,
      line_fields.submissionLineIdType,
      line_fields.submissionLineId,
      line_fields.lineNameCount,
      line_fields.lineNameType,
      line_fields.lineName,
      line_fields.monthlyAmountCount,
      line_fields.monthlyAmountType,
      line_fields.monthlyAmount,
      line_fields.estimatedRateCount,
      line_fields.estimatedRateType,
      line_fields.estimatedRate,
      line_fields.actualRateCount,
      line_fields.actualRateType,
      line_fields.actualRate,
      line_fields.estimatedTotalCount,
      line_fields.estimatedTotalType,
      line_fields.estimatedTotal,
      line_fields.actualTotalCount,
      line_fields.actualTotalType,
      line_fields.actualTotal,
      line_fields.childCareSpaceCategoryIdCount,
      line_fields.childCareSpaceCategoryIdType,
      line_fields.childCareSpaceCategoryId,
      metadata.metadataCount,
      metadata.metadataType,
      metadata_fields.unknownMetadataPropertyCount,
      metadata_fields.preEnhancementAmountCount,
      metadata_fields.preEnhancementAmountType,
      metadata_fields.preEnhancementAmount,
      metadata_fields.hotMealCount,
      metadata_fields.hotMealType,
      hot_meal_fields.hotMealPropertyCount,
      hot_meal_fields.unknownHotMealPropertyCount,
      hot_meal_fields.hotMealAmountCount,
      hot_meal_fields.hotMealAmountType,
      hot_meal_fields.hotMealAmount,
      hot_meal_fields.hotMealAppliedAtCount,
      hot_meal_fields.hotMealAppliedAtType,
      hot_meal_fields.hotMealAppliedAt,
      CONVERT(NVARCHAR(33), funding_submission_line_jsons.created_at, 126) AS createdAt,
      CONVERT(NVARCHAR(33), funding_submission_line_jsons.updated_at, 126) AS updatedAt,
      CONVERT(
        NVARCHAR(33),
        CONVERT(DATETIME2(7), SWITCHOFFSET(funding_submission_line_jsons.deleted_at, '+00:00')),
        126
      ) AS deletedAt
    FROM funding_submission_line_jsons
    CROSS APPLY OPENJSON(funding_submission_line_jsons.[values]) AS worksheet_lines
    CROSS APPLY (
      SELECT
        COUNT(CASE WHEN worksheet_properties.[key] COLLATE Latin1_General_100_BIN2 = N'sectionName'
          AND DATALENGTH(worksheet_properties.[key]) = DATALENGTH(N'sectionName') THEN 1 END) AS sectionNameCount,
        MAX(CASE WHEN worksheet_properties.[key] COLLATE Latin1_General_100_BIN2 = N'sectionName'
          AND DATALENGTH(worksheet_properties.[key]) = DATALENGTH(N'sectionName') THEN worksheet_properties.type END) AS sectionNameType,
        MAX(CASE WHEN worksheet_properties.[key] COLLATE Latin1_General_100_BIN2 = N'sectionName'
          AND DATALENGTH(worksheet_properties.[key]) = DATALENGTH(N'sectionName') THEN worksheet_properties.value END) AS sectionName,
        COUNT(CASE WHEN worksheet_properties.[key] COLLATE Latin1_General_100_BIN2 = N'submissionLineId'
          AND DATALENGTH(worksheet_properties.[key]) = DATALENGTH(N'submissionLineId') THEN 1 END) AS submissionLineIdCount,
        MAX(CASE WHEN worksheet_properties.[key] COLLATE Latin1_General_100_BIN2 = N'submissionLineId'
          AND DATALENGTH(worksheet_properties.[key]) = DATALENGTH(N'submissionLineId') THEN worksheet_properties.type END) AS submissionLineIdType,
        MAX(CASE WHEN worksheet_properties.[key] COLLATE Latin1_General_100_BIN2 = N'submissionLineId'
          AND DATALENGTH(worksheet_properties.[key]) = DATALENGTH(N'submissionLineId') THEN worksheet_properties.value END) AS submissionLineId,
        COUNT(CASE WHEN worksheet_properties.[key] COLLATE Latin1_General_100_BIN2 = N'lineName'
          AND DATALENGTH(worksheet_properties.[key]) = DATALENGTH(N'lineName') THEN 1 END) AS lineNameCount,
        MAX(CASE WHEN worksheet_properties.[key] COLLATE Latin1_General_100_BIN2 = N'lineName'
          AND DATALENGTH(worksheet_properties.[key]) = DATALENGTH(N'lineName') THEN worksheet_properties.type END) AS lineNameType,
        MAX(CASE WHEN worksheet_properties.[key] COLLATE Latin1_General_100_BIN2 = N'lineName'
          AND DATALENGTH(worksheet_properties.[key]) = DATALENGTH(N'lineName') THEN worksheet_properties.value END) AS lineName,
        COUNT(CASE WHEN worksheet_properties.[key] COLLATE Latin1_General_100_BIN2 = N'monthlyAmount'
          AND DATALENGTH(worksheet_properties.[key]) = DATALENGTH(N'monthlyAmount') THEN 1 END) AS monthlyAmountCount,
        MAX(CASE WHEN worksheet_properties.[key] COLLATE Latin1_General_100_BIN2 = N'monthlyAmount'
          AND DATALENGTH(worksheet_properties.[key]) = DATALENGTH(N'monthlyAmount') THEN worksheet_properties.type END) AS monthlyAmountType,
        MAX(CASE WHEN worksheet_properties.[key] COLLATE Latin1_General_100_BIN2 = N'monthlyAmount'
          AND DATALENGTH(worksheet_properties.[key]) = DATALENGTH(N'monthlyAmount') THEN worksheet_properties.value END) AS monthlyAmount,
        COUNT(CASE WHEN worksheet_properties.[key] COLLATE Latin1_General_100_BIN2 = N'estimatedChildOccupancyRate'
          AND DATALENGTH(worksheet_properties.[key]) = DATALENGTH(N'estimatedChildOccupancyRate') THEN 1 END) AS estimatedRateCount,
        MAX(CASE WHEN worksheet_properties.[key] COLLATE Latin1_General_100_BIN2 = N'estimatedChildOccupancyRate'
          AND DATALENGTH(worksheet_properties.[key]) = DATALENGTH(N'estimatedChildOccupancyRate') THEN worksheet_properties.type END) AS estimatedRateType,
        MAX(CASE WHEN worksheet_properties.[key] COLLATE Latin1_General_100_BIN2 = N'estimatedChildOccupancyRate'
          AND DATALENGTH(worksheet_properties.[key]) = DATALENGTH(N'estimatedChildOccupancyRate') THEN worksheet_properties.value END) AS estimatedRate,
        COUNT(CASE WHEN worksheet_properties.[key] COLLATE Latin1_General_100_BIN2 = N'actualChildOccupancyRate'
          AND DATALENGTH(worksheet_properties.[key]) = DATALENGTH(N'actualChildOccupancyRate') THEN 1 END) AS actualRateCount,
        MAX(CASE WHEN worksheet_properties.[key] COLLATE Latin1_General_100_BIN2 = N'actualChildOccupancyRate'
          AND DATALENGTH(worksheet_properties.[key]) = DATALENGTH(N'actualChildOccupancyRate') THEN worksheet_properties.type END) AS actualRateType,
        MAX(CASE WHEN worksheet_properties.[key] COLLATE Latin1_General_100_BIN2 = N'actualChildOccupancyRate'
          AND DATALENGTH(worksheet_properties.[key]) = DATALENGTH(N'actualChildOccupancyRate') THEN worksheet_properties.value END) AS actualRate,
        COUNT(CASE WHEN worksheet_properties.[key] COLLATE Latin1_General_100_BIN2 = N'estimatedComputedTotal'
          AND DATALENGTH(worksheet_properties.[key]) = DATALENGTH(N'estimatedComputedTotal') THEN 1 END) AS estimatedTotalCount,
        MAX(CASE WHEN worksheet_properties.[key] COLLATE Latin1_General_100_BIN2 = N'estimatedComputedTotal'
          AND DATALENGTH(worksheet_properties.[key]) = DATALENGTH(N'estimatedComputedTotal') THEN worksheet_properties.type END) AS estimatedTotalType,
        MAX(CASE WHEN worksheet_properties.[key] COLLATE Latin1_General_100_BIN2 = N'estimatedComputedTotal'
          AND DATALENGTH(worksheet_properties.[key]) = DATALENGTH(N'estimatedComputedTotal') THEN worksheet_properties.value END) AS estimatedTotal,
        COUNT(CASE WHEN worksheet_properties.[key] COLLATE Latin1_General_100_BIN2 = N'actualComputedTotal'
          AND DATALENGTH(worksheet_properties.[key]) = DATALENGTH(N'actualComputedTotal') THEN 1 END) AS actualTotalCount,
        MAX(CASE WHEN worksheet_properties.[key] COLLATE Latin1_General_100_BIN2 = N'actualComputedTotal'
          AND DATALENGTH(worksheet_properties.[key]) = DATALENGTH(N'actualComputedTotal') THEN worksheet_properties.type END) AS actualTotalType,
        MAX(CASE WHEN worksheet_properties.[key] COLLATE Latin1_General_100_BIN2 = N'actualComputedTotal'
          AND DATALENGTH(worksheet_properties.[key]) = DATALENGTH(N'actualComputedTotal') THEN worksheet_properties.value END) AS actualTotal,
        COUNT(CASE WHEN worksheet_properties.[key] COLLATE Latin1_General_100_BIN2 = N'childCareSpaceCategoryId'
          AND DATALENGTH(worksheet_properties.[key]) = DATALENGTH(N'childCareSpaceCategoryId') THEN 1 END) AS childCareSpaceCategoryIdCount,
        MAX(CASE WHEN worksheet_properties.[key] COLLATE Latin1_General_100_BIN2 = N'childCareSpaceCategoryId'
          AND DATALENGTH(worksheet_properties.[key]) = DATALENGTH(N'childCareSpaceCategoryId') THEN worksheet_properties.type END) AS childCareSpaceCategoryIdType,
        MAX(CASE WHEN worksheet_properties.[key] COLLATE Latin1_General_100_BIN2 = N'childCareSpaceCategoryId'
          AND DATALENGTH(worksheet_properties.[key]) = DATALENGTH(N'childCareSpaceCategoryId') THEN worksheet_properties.value END) AS childCareSpaceCategoryId
      FROM OPENJSON(CASE WHEN worksheet_lines.type = 5 THEN worksheet_lines.value ELSE N'{}' END) AS worksheet_properties
    ) AS line_fields
    OUTER APPLY (
      SELECT
        COUNT(CASE WHEN line_metadata.[key] COLLATE Latin1_General_100_BIN2 = N'programQualityEnhancements'
          AND DATALENGTH(line_metadata.[key]) = DATALENGTH(N'programQualityEnhancements') THEN 1 END) AS metadataCount,
        MAX(CASE WHEN line_metadata.[key] COLLATE Latin1_General_100_BIN2 = N'programQualityEnhancements'
          AND DATALENGTH(line_metadata.[key]) = DATALENGTH(N'programQualityEnhancements') THEN line_metadata.type END) AS metadataType
      FROM OPENJSON(CASE WHEN worksheet_lines.type = 5 THEN worksheet_lines.value ELSE N'{}' END) AS line_metadata
    ) AS metadata
    OUTER APPLY (
      SELECT
        SUM(CASE WHEN metadata_property.[key] COLLATE Latin1_General_100_BIN2 NOT IN
            (N'preEnhancementAmount', N'hot_meal')
            OR DATALENGTH(metadata_property.[key]) NOT IN
              (DATALENGTH(N'preEnhancementAmount'), DATALENGTH(N'hot_meal'))
          THEN 1 ELSE 0 END) AS unknownMetadataPropertyCount,
        COUNT(CASE WHEN metadata_property.[key] COLLATE Latin1_General_100_BIN2 = N'preEnhancementAmount'
          AND DATALENGTH(metadata_property.[key]) = DATALENGTH(N'preEnhancementAmount') THEN 1 END) AS preEnhancementAmountCount,
        MAX(CASE WHEN metadata_property.[key] COLLATE Latin1_General_100_BIN2 = N'preEnhancementAmount'
          AND DATALENGTH(metadata_property.[key]) = DATALENGTH(N'preEnhancementAmount') THEN metadata_property.type END) AS preEnhancementAmountType,
        MAX(CASE WHEN metadata_property.[key] COLLATE Latin1_General_100_BIN2 = N'preEnhancementAmount'
          AND DATALENGTH(metadata_property.[key]) = DATALENGTH(N'preEnhancementAmount') THEN metadata_property.value END) AS preEnhancementAmount,
        COUNT(CASE WHEN metadata_property.[key] COLLATE Latin1_General_100_BIN2 = N'hot_meal'
          AND DATALENGTH(metadata_property.[key]) = DATALENGTH(N'hot_meal') THEN 1 END) AS hotMealCount,
        MAX(CASE WHEN metadata_property.[key] COLLATE Latin1_General_100_BIN2 = N'hot_meal'
          AND DATALENGTH(metadata_property.[key]) = DATALENGTH(N'hot_meal') THEN metadata_property.type END) AS hotMealType,
        MAX(CASE WHEN metadata_property.[key] COLLATE Latin1_General_100_BIN2 = N'hot_meal'
          AND DATALENGTH(metadata_property.[key]) = DATALENGTH(N'hot_meal') THEN metadata_property.value END) AS hotMealValue
      FROM OPENJSON(
        CASE
          WHEN metadata.metadataCount = 1 AND metadata.metadataType = 5
            THEN JSON_QUERY(worksheet_lines.value, '$.programQualityEnhancements')
          ELSE N'{}'
        END
      ) AS metadata_property
    ) AS metadata_fields
    OUTER APPLY (
      SELECT
        COUNT(*) AS hotMealPropertyCount,
        SUM(CASE WHEN hot_meal_property.[key] COLLATE Latin1_General_100_BIN2 NOT IN
            (N'amount', N'appliedAt')
            OR DATALENGTH(hot_meal_property.[key]) NOT IN
              (DATALENGTH(N'amount'), DATALENGTH(N'appliedAt'))
          THEN 1 ELSE 0 END) AS unknownHotMealPropertyCount,
        COUNT(CASE WHEN hot_meal_property.[key] COLLATE Latin1_General_100_BIN2 = N'amount'
          AND DATALENGTH(hot_meal_property.[key]) = DATALENGTH(N'amount') THEN 1 END) AS hotMealAmountCount,
        MAX(CASE WHEN hot_meal_property.[key] COLLATE Latin1_General_100_BIN2 = N'amount'
          AND DATALENGTH(hot_meal_property.[key]) = DATALENGTH(N'amount') THEN hot_meal_property.type END) AS hotMealAmountType,
        MAX(CASE WHEN hot_meal_property.[key] COLLATE Latin1_General_100_BIN2 = N'amount'
          AND DATALENGTH(hot_meal_property.[key]) = DATALENGTH(N'amount') THEN hot_meal_property.value END) AS hotMealAmount,
        COUNT(CASE WHEN hot_meal_property.[key] COLLATE Latin1_General_100_BIN2 = N'appliedAt'
          AND DATALENGTH(hot_meal_property.[key]) = DATALENGTH(N'appliedAt') THEN 1 END) AS hotMealAppliedAtCount,
        MAX(CASE WHEN hot_meal_property.[key] COLLATE Latin1_General_100_BIN2 = N'appliedAt'
          AND DATALENGTH(hot_meal_property.[key]) = DATALENGTH(N'appliedAt') THEN hot_meal_property.type END) AS hotMealAppliedAtType,
        MAX(CASE WHEN hot_meal_property.[key] COLLATE Latin1_General_100_BIN2 = N'appliedAt'
          AND DATALENGTH(hot_meal_property.[key]) = DATALENGTH(N'appliedAt') THEN hot_meal_property.value END) AS hotMealAppliedAt
      FROM OPENJSON(
        CASE
          WHEN metadata_fields.hotMealCount = 1 AND metadata_fields.hotMealType = 5
            THEN metadata_fields.hotMealValue
          ELSE N'{}'
        END
      ) AS hot_meal_property
    ) AS hot_meal_fields
    WHERE worksheet_lines.type = 5
      AND EXISTS (
        SELECT 1
        FROM OPENJSON(worksheet_lines.value) AS section_properties
        WHERE section_properties.[key] COLLATE Latin1_General_100_BIN2 = N'sectionName'
          AND DATALENGTH(section_properties.[key]) = DATALENGTH(N'sectionName')
          AND section_properties.type = 1
          AND section_properties.value COLLATE Latin1_General_100_BIN2
            = :sectionName COLLATE Latin1_General_100_BIN2
          AND DATALENGTH(section_properties.value) = DATALENGTH(:sectionName)
      )
    ORDER BY funding_submission_line_jsons.id, TRY_CONVERT(INT, worksheet_lines.[key])
  `,
    { sectionName: SECTION_NAME }
  )
}

function validateWorksheetLine(line: WorksheetEnhancement): void {
  if (line.lineIndex === null || line.lineIndex < 0) {
    throw new Error(
      `Quality Enhancement Program worksheet ${line.worksheetId} has an invalid line index.`
    )
  }
  if (line.sectionNameCount !== 1 || line.sectionNameType !== 1) {
    throw new Error(
      `Quality Enhancement Program worksheet ${line.worksheetId} has invalid section metadata.`
    )
  }
  if (
    line.submissionLineIdCount > 1 ||
    (line.submissionLineIdCount === 1 && line.submissionLineIdType !== 2)
  ) {
    throw new Error(
      `Quality Enhancement Program worksheet ${line.worksheetId} line ${line.lineIndex} has an invalid submission line identifier.`
    )
  }
  if (
    line.lineNameCount !== 1 ||
    line.lineNameType !== 1 ||
    line.lineName === null ||
    line.lineName.length > 200
  ) {
    throw new Error(
      `Quality Enhancement Program worksheet ${line.worksheetId} line ${line.lineIndex} has an invalid line name.`
    )
  }
  requireScalarAmount(
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
    "estimated occupancy rate",
    line
  )
  validateOptionalAmount(
    line.actualRateCount,
    line.actualRateType,
    line.actualRate,
    "actual occupancy rate",
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

  if (
    line.childCareSpaceCategoryIdCount > 1 ||
    (line.childCareSpaceCategoryIdCount === 1 &&
      ![0, 2].includes(line.childCareSpaceCategoryIdType ?? -1))
  ) {
    throw new Error(
      `Quality Enhancement Program worksheet ${line.worksheetId} line ${line.lineIndex} has an invalid child care space category identifier.`
    )
  }
  if (line.metadataCount > 1) {
    throw new Error(
      `Quality Enhancement Program worksheet ${line.worksheetId} line ${line.lineIndex} has duplicate enhancement metadata.`
    )
  }
  if (line.metadataCount === 1 && line.metadataType !== 5) {
    throw new Error(
      `Quality Enhancement Program worksheet ${line.worksheetId} line ${line.lineIndex} has non-object enhancement metadata.`
    )
  }
  if (line.metadataCount === 1) {
    validateEnhancementMetadata(line)
  }
}

function requireScalarAmount(
  count: number,
  type: number | null,
  value: string | null,
  label: string,
  line: WorksheetEnhancement
): string {
  if (count !== 1 || !isDecimalJsonType(type) || value === null) {
    throw new Error(
      `Quality Enhancement Program worksheet ${line.worksheetId} line ${line.lineIndex} has an invalid ${label}.`
    )
  }
  return value
}

function validateOptionalAmount(
  count: number,
  type: number | null,
  value: string | null,
  label: string,
  line: WorksheetEnhancement
): void {
  if (count > 1 || (count === 1 && (!isDecimalJsonType(type) || value === null))) {
    throw new Error(
      `Quality Enhancement Program worksheet ${line.worksheetId} line ${line.lineIndex} has an invalid ${label}.`
    )
  }
}

function validateEnhancementMetadata(line: WorksheetEnhancement): void {
  if (
    line.unknownMetadataPropertyCount !== 0 ||
    line.preEnhancementAmountCount !== 1 ||
    !isDecimalJsonType(line.preEnhancementAmountType) ||
    line.preEnhancementAmount === null ||
    line.hotMealCount > 1
  ) {
    throw new Error(
      `Quality Enhancement Program worksheet ${line.worksheetId} line ${line.lineIndex} has unknown or incomplete enhancement metadata.`
    )
  }
  if (line.hotMealCount === 0) {
    return
  }
  if (
    line.hotMealType !== 5 ||
    line.hotMealPropertyCount < 1 ||
    line.unknownHotMealPropertyCount !== 0 ||
    line.hotMealAmountCount !== 1 ||
    !isDecimalJsonType(line.hotMealAmountType) ||
    line.hotMealAmount === null ||
    line.hotMealAppliedAtCount > 1 ||
    (line.hotMealAppliedAtCount === 1 &&
      line.hotMealAppliedAtType !== 0 &&
      line.hotMealAppliedAtType !== 1)
  ) {
    throw new Error(
      `Quality Enhancement Program worksheet ${line.worksheetId} line ${line.lineIndex} has invalid hot meal metadata.`
    )
  }
}

function isDecimalJsonType(type: number | null): boolean {
  return type === 1 || type === 2
}

function findFiscalPeriod(
  fiscalPeriods: FiscalPeriodMatch[],
  line: WorksheetEnhancement
): FiscalPeriodMatch {
  const matches = fiscalPeriods.filter(
    (fiscalPeriod) => fiscalPeriod.worksheetId === line.worksheetId
  )
  if (matches.length !== 1) {
    throw new Error(
      `Quality Enhancement Program worksheet ${line.worksheetId} resolves to ${matches.length} fiscal periods.`
    )
  }
  return matches[0]
}

async function findFiscalPeriodMatches(
  knex: Knex,
  worksheetEnhancements: WorksheetEnhancement[]
): Promise<FiscalPeriodMatch[]> {
  const worksheetIds = [...new Set(worksheetEnhancements.map((line) => line.worksheetId))]
  const ids = worksheetIds.join(",")
  return knex.raw<FiscalPeriodMatch[]>(`
    SELECT
      funding_submission_line_jsons.id AS worksheetId,
      funding_periods.id AS fundingPeriodId,
      fiscal_periods.id AS fiscalPeriodId
    FROM funding_submission_line_jsons
    INNER JOIN funding_periods
      ON LEFT(funding_periods.fiscal_year, 4) + '/' + RIGHT(funding_periods.fiscal_year, 2)
        = funding_submission_line_jsons.fiscal_year
    INNER JOIN fiscal_periods
      ON fiscal_periods.funding_period_id = funding_periods.id
      AND LOWER(fiscal_periods.month) = LOWER(funding_submission_line_jsons.date_name)
    WHERE funding_submission_line_jsons.id IN (${ids})
  `)
}

function findSourceConfiguration(
  line: WorksheetEnhancement,
  fundingPeriodId: number,
  sourceConfigurations: SourceConfiguration[]
): SourceConfiguration {
  if (line.submissionLineIdCount === 1) {
    const submissionLineId = parseInteger(line.submissionLineId, "submission line identifier", line)
    const matches = sourceConfigurations.filter(
      (configuration) =>
        configuration.id === submissionLineId &&
        configuration.fundingPeriodId === fundingPeriodId &&
        configuration.fiscalYear === line.fiscalYear
    )
    if (matches.length !== 1) {
      throw new Error(
        `Quality Enhancement Program worksheet ${line.worksheetId} line ${line.lineIndex} has no matching configuration for submission line ${submissionLineId}.`
      )
    }
    return matches[0]
  }

  const matches = sourceConfigurations.filter(
    (configuration) =>
      configuration.fundingPeriodId === fundingPeriodId &&
      configuration.categoryName === line.lineName
  )
  if (matches.length !== 1) {
    throw new Error(
      `Quality Enhancement Program worksheet ${line.worksheetId} line ${line.lineIndex} has an unresolved or ambiguous configuration label.`
    )
  }
  return matches[0]
}

function parseInteger(value: string | null, label: string, line: WorksheetEnhancement): number {
  if (value === null || !/^(0|[1-9][0-9]*)$/.test(value)) {
    throw new Error(
      `Quality Enhancement Program worksheet ${line.worksheetId} line ${line.lineIndex} has an invalid ${label}.`
    )
  }
  const parsedValue = Number(value)
  if (!Number.isSafeInteger(parsedValue)) {
    throw new Error(
      `Quality Enhancement Program worksheet ${line.worksheetId} line ${line.lineIndex} has an out-of-range ${label}.`
    )
  }
  return parsedValue
}

function ledgerAttributesFor(
  line: WorksheetEnhancement,
  fundingPeriodId: number,
  fiscalPeriodId: number,
  categoryId: number,
  sourceConfiguration: SourceConfiguration,
  spaceCategories: SpaceCategory[]
): LedgerAttributes {
  const monthlyAmount = decimalForDatabase(
    requireScalarAmount(
      line.monthlyAmountCount,
      line.monthlyAmountType,
      line.monthlyAmount,
      "monthly amount",
      line
    ),
    `worksheet ${line.worksheetId} line ${line.lineIndex} monthly amount`
  )
  const metadataExists = line.metadataCount === 1
  const baseMonthlyAmount = decimalForDatabase(
    metadataExists ? line.preEnhancementAmount : monthlyAmount,
    `worksheet ${line.worksheetId} line ${line.lineIndex} base monthly amount`
  )
  const hotMealIncrementAmount = decimalForDatabase(
    metadataExists && line.hotMealCount === 1 ? line.hotMealAmount : "0",
    `worksheet ${line.worksheetId} line ${line.lineIndex} hot meal increment`
  )
  const effectiveAmount = Big(baseMonthlyAmount).plus(hotMealIncrementAmount)
  if (!effectiveAmount.eq(monthlyAmount)) {
    throw new Error(
      `Quality Enhancement Program worksheet ${line.worksheetId} line ${line.lineIndex} has enhancement metadata inconsistent with its effective monthly amount.`
    )
  }

  const estimatedRate = decimalForDatabase(
    line.estimatedRateCount === 0 ? "0" : line.estimatedRate,
    `worksheet ${line.worksheetId} line ${line.lineIndex} estimated occupancy rate`
  )
  const actualRate = decimalForDatabase(
    line.actualRateCount === 0 ? "0" : line.actualRate,
    `worksheet ${line.worksheetId} line ${line.lineIndex} actual occupancy rate`
  )
  const estimatedTotal =
    line.estimatedTotalCount === 0
      ? decimalForDatabase(
          Big(monthlyAmount).times(estimatedRate).toFixed(4),
          `worksheet ${line.worksheetId} line ${line.lineIndex} estimated total`
        )
      : decimalForDatabase(
          line.estimatedTotal,
          `worksheet ${line.worksheetId} line ${line.lineIndex} estimated total`
        )
  const actualTotal =
    line.actualTotalCount === 0
      ? decimalForDatabase(
          Big(monthlyAmount).times(actualRate).toFixed(4),
          `worksheet ${line.worksheetId} line ${line.lineIndex} actual total`
        )
      : decimalForDatabase(
          line.actualTotal,
          `worksheet ${line.worksheetId} line ${line.lineIndex} actual total`
        )

  const explicitSpaceCategoryId = parseSpaceCategoryId(line)
  const childCareSpaceCategoryId =
    explicitSpaceCategoryId === undefined
      ? (sourceConfiguration.childCareSpaceCategoryId ??
        findConfigurationSpaceCategoryId(sourceConfiguration, fundingPeriodId, spaceCategories))
      : explicitSpaceCategoryId
  if (
    childCareSpaceCategoryId !== null &&
    !spaceCategories.some(
      (category) =>
        category.id === childCareSpaceCategoryId && category.fundingPeriodId === fundingPeriodId
    )
  ) {
    throw new Error(
      `Quality Enhancement Program worksheet ${line.worksheetId} line ${line.lineIndex} links to a child care space category outside its funding period.`
    )
  }

  const hotMealAppliedAt =
    metadataExists && line.hotMealCount === 1
      ? dateForDatabase(
          line.hotMealAppliedAtCount === 0 || line.hotMealAppliedAtType === 0
            ? null
            : line.hotMealAppliedAt
        )
      : null
  if (line.lineName === null) {
    throw new Error(`Quality Enhancement Program worksheet ${line.worksheetId} has no line name.`)
  }

  return {
    worksheetId: line.worksheetId,
    centreId: line.centreId,
    fiscalPeriodId,
    categoryId,
    childCareSpaceCategoryId,
    lineName: line.lineName,
    baseMonthlyAmount,
    hotMealIncrementAmount,
    hotMealAppliedAt,
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

function parseSpaceCategoryId(line: WorksheetEnhancement): number | null | undefined {
  if (line.childCareSpaceCategoryIdCount === 0) {
    return undefined
  }
  if (line.childCareSpaceCategoryIdType === 0) {
    return null
  }
  if (line.childCareSpaceCategoryIdType !== 2) {
    throw new Error(
      `Quality Enhancement Program worksheet ${line.worksheetId} line ${line.lineIndex} has an invalid child care space category identifier.`
    )
  }
  return parseInteger(line.childCareSpaceCategoryId, "child care space category identifier", line)
}

function decimalForDatabase(value: string | null, label: string): string {
  if (value === null) {
    throw new Error(`Quality Enhancement Program ${label} is not a valid decimal.`)
  }

  let decimal: Big
  try {
    decimal = Big(value)
  } catch {
    throw new Error(`Quality Enhancement Program ${label} is not a valid decimal.`)
  }

  if (decimal.abs().gt(MAX_DECIMAL_15_4)) {
    throw new Error(`Quality Enhancement Program ${label} exceeds DECIMAL(15,4).`)
  }
  const normalizedValue = decimal.toFixed(4)
  if (!decimal.eq(normalizedValue)) {
    throw new Error(`Quality Enhancement Program ${label} would lose decimal precision.`)
  }
  return normalizedValue
}

function dateForDatabase(value: string | null): string | null {
  if (value === null) {
    return null
  }
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp)) {
    throw new Error(
      `Quality Enhancement Program hot meal appliedAt value '${value}' is not a valid date.`
    )
  }
  return new Date(timestamp).toISOString().slice(0, 10)
}

async function findExistingEnhancements(knex: Knex): Promise<ExistingEnhancement[]> {
  return knex.raw<ExistingEnhancement[]>(`
    SELECT
      id,
      centre_id AS centreId,
      fiscal_period_id AS fiscalPeriodId,
      category_id AS categoryId,
      child_care_space_category_id AS childCareSpaceCategoryId,
      line_name AS lineName,
      CONVERT(NVARCHAR(40), base_monthly_amount) AS baseMonthlyAmount,
      CONVERT(NVARCHAR(40), hot_meal_increment_amount) AS hotMealIncrementAmount,
      CONVERT(NVARCHAR(10), hot_meal_applied_at, 23) AS hotMealAppliedAt,
      CONVERT(NVARCHAR(40), monthly_amount) AS monthlyAmount,
      CONVERT(NVARCHAR(40), estimated_child_occupancy_rate) AS estimatedRate,
      CONVERT(NVARCHAR(40), actual_child_occupancy_rate) AS actualRate,
      CONVERT(NVARCHAR(40), estimated_computed_total) AS estimatedTotal,
      CONVERT(NVARCHAR(40), actual_computed_total) AS actualTotal,
      CONVERT(NVARCHAR(33), created_at, 126) AS createdAt,
      CONVERT(NVARCHAR(33), updated_at, 126) AS updatedAt,
      CONVERT(NVARCHAR(33), deleted_at, 126) AS deletedAt
    FROM quality_enhancements
  `)
}

async function migrateLedgerRows(
  knex: Knex,
  ledgerRows: LedgerAttributes[],
  existingEnhancements: ExistingEnhancement[]
): Promise<void> {
  const consumedExistingIds = new Set<number>()
  const activeKeys = new Set<string>()
  for (const ledgerRow of ledgerRows) {
    const activeKey = `${ledgerRow.centreId}:${ledgerRow.fiscalPeriodId}:${ledgerRow.categoryId}`
    if (ledgerRow.deletedAt === null && activeKeys.has(activeKey)) {
      throw new Error(
        `Quality Enhancement Program worksheet ${ledgerRow.worksheetId} duplicates an active centre, period, and category ledger row.`
      )
    }
    if (ledgerRow.deletedAt === null) {
      activeKeys.add(activeKey)
    }

    const matchingRows = existingEnhancements.filter(
      (existing) =>
        existing.centreId === ledgerRow.centreId &&
        existing.fiscalPeriodId === ledgerRow.fiscalPeriodId &&
        existing.categoryId === ledgerRow.categoryId &&
        sameDate(existing.deletedAt, ledgerRow.deletedAt)
    )
    const matchingUnconsumedRows = matchingRows.filter(
      (existing) => !consumedExistingIds.has(existing.id)
    )
    const identicalRows = matchingUnconsumedRows.filter((existing) =>
      ledgerMatches(existing, ledgerRow)
    )
    if (identicalRows.length > 0) {
      consumedExistingIds.add(identicalRows[0].id)
      continue
    }
    if (ledgerRow.deletedAt === null && matchingRows.length > 0) {
      throw new Error(
        `Quality Enhancement Program worksheet ${ledgerRow.worksheetId} conflicts with existing active ledger data.`
      )
    }

    await knex("quality_enhancements").insert({
      centre_id: ledgerRow.centreId,
      fiscal_period_id: ledgerRow.fiscalPeriodId,
      category_id: ledgerRow.categoryId,
      child_care_space_category_id: ledgerRow.childCareSpaceCategoryId,
      line_name: ledgerRow.lineName,
      base_monthly_amount: ledgerRow.baseMonthlyAmount,
      hot_meal_increment_amount: ledgerRow.hotMealIncrementAmount,
      hot_meal_applied_at: ledgerRow.hotMealAppliedAt,
      monthly_amount: ledgerRow.monthlyAmount,
      estimated_child_occupancy_rate: ledgerRow.estimatedRate,
      actual_child_occupancy_rate: ledgerRow.actualRate,
      estimated_computed_total: ledgerRow.estimatedTotal,
      actual_computed_total: ledgerRow.actualTotal,
      created_at: ledgerRow.createdAt,
      updated_at: ledgerRow.updatedAt,
      deleted_at: ledgerRow.deletedAt,
    })
  }
}

function ledgerMatches(existing: ExistingEnhancement, expected: LedgerAttributes): boolean {
  return (
    existing.childCareSpaceCategoryId === expected.childCareSpaceCategoryId &&
    existing.lineName === expected.lineName &&
    Big(existing.baseMonthlyAmount).eq(expected.baseMonthlyAmount) &&
    Big(existing.hotMealIncrementAmount).eq(expected.hotMealIncrementAmount) &&
    existing.hotMealAppliedAt === expected.hotMealAppliedAt &&
    Big(existing.monthlyAmount).eq(expected.monthlyAmount) &&
    Big(existing.estimatedRate).eq(expected.estimatedRate) &&
    Big(existing.actualRate).eq(expected.actualRate) &&
    Big(existing.estimatedTotal).eq(expected.estimatedTotal) &&
    Big(existing.actualTotal).eq(expected.actualTotal) &&
    sameDate(existing.createdAt, expected.createdAt) &&
    sameDate(existing.updatedAt, expected.updatedAt)
  )
}

function sameDate(left: string | null, right: string | null): boolean {
  if (left === null || right === null) {
    return left === right
  }
  return new Date(left).getTime() === new Date(right).getTime()
}

function legacyFiscalYear(fiscalYear: string): string {
  return `${fiscalYear.slice(0, 4)}/${fiscalYear.slice(-2)}`
}

async function removeQualityEnhancementJson(knex: Knex): Promise<void> {
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
        WHERE worksheet_lines.type <> 5
          OR JSON_VALUE(worksheet_lines.value, '$.sectionName') IS NULL
          OR JSON_VALUE(worksheet_lines.value, '$.sectionName')
            COLLATE Latin1_General_100_BIN2 <> :sectionName COLLATE Latin1_General_100_BIN2
          OR DATALENGTH(JSON_VALUE(worksheet_lines.value, '$.sectionName'))
            <> DATALENGTH(:sectionName)
      ),
      N'[]'
    )
    WHERE EXISTS (
      SELECT 1
      FROM OPENJSON(funding_submission_line_jsons.[values]) AS worksheet_lines
      WHERE worksheet_lines.type = 5
        AND JSON_VALUE(worksheet_lines.value, '$.sectionName')
          COLLATE Latin1_General_100_BIN2 = :sectionName COLLATE Latin1_General_100_BIN2
        AND DATALENGTH(JSON_VALUE(worksheet_lines.value, '$.sectionName'))
          = DATALENGTH(:sectionName)
    )
  `,
    { sectionName: SECTION_NAME }
  )

  const remainingSourceRows = await knex.raw<{ id: number }[]>(`
    SELECT TOP 1 funding_submission_line_jsons.id
    FROM funding_submission_line_jsons
    CROSS APPLY OPENJSON(funding_submission_line_jsons.[values]) AS worksheet_lines
    WHERE worksheet_lines.type = 5
      AND JSON_VALUE(worksheet_lines.value, '$.sectionName')
        COLLATE Latin1_General_100_BIN2 = N'${SECTION_NAME}' COLLATE Latin1_General_100_BIN2
      AND DATALENGTH(JSON_VALUE(worksheet_lines.value, '$.sectionName'))
        = DATALENGTH(N'${SECTION_NAME}')
  `)
  if (remainingSourceRows.length > 0) {
    throw new Error(
      `Quality Enhancement Program source JSON remains in worksheet ${remainingSourceRows[0].id} after backfill.`
    )
  }
}

async function retireSourceConfigurations(knex: Knex): Promise<void> {
  await knex.raw(
    `
    DELETE FROM funding_submission_lines
    WHERE section_name COLLATE Latin1_General_100_BIN2 = :sectionName COLLATE Latin1_General_100_BIN2
      AND DATALENGTH(section_name) = DATALENGTH(:sectionName)
  `,
    { sectionName: SECTION_NAME }
  )
}

export async function down(_knex: Knex): Promise<void> {
  console.warn(
    "WARNING: Quality Enhancement Program configuration and worksheet values were moved into annual categories and monthly ledger rows. Rolling back requires manual restoration of the original source data."
  )
}
