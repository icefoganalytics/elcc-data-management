import type { Knex } from "knex"
import { isUndefined } from "lodash"

import {
  down as unlinkCategories,
  up as linkCategories,
} from "@/db/migrations/20261009024301_link-funding-submission-lines-to-child-care-space-categories"
import { up as addCategoryId } from "@/db/migrations/20261009021603_add-category-id-to-child-care-spaces"
import {
  createLegacyChildCareSpace,
  withLegacyChildCareSpaceSchema,
} from "@/db/migrations/legacy-child-care-spaces"

const APRIL_START = new Date("2024-04-01T00:00:00Z")
const APRIL_END = new Date("2024-04-30T23:59:59Z")

type IdRow = { id: number }
type WorksheetLine = Record<string, unknown>

async function insertRow(
  transaction: Knex.Transaction,
  tableName: string,
  attributes: Record<string, unknown>
): Promise<number> {
  const [row] = await transaction(tableName).insert(attributes).returning<IdRow[]>("id")
  if (isUndefined(row)) {
    throw new Error(`Unable to insert fixture row into ${tableName}.`)
  }

  return row.id
}

async function createFundingPeriod(transaction: Knex.Transaction): Promise<number> {
  return insertRow(transaction, "funding_periods", {
    fiscal_year: "2024-2025",
    from_date: new Date("2024-04-01T00:00:00Z"),
    to_date: new Date("2025-03-31T23:59:59Z"),
    title: "Child care space linkage fixture",
  })
}

async function createFiscalPeriod(
  transaction: Knex.Transaction,
  fundingPeriodId: number,
  month = "April"
): Promise<number> {
  return insertRow(transaction, "fiscal_periods", {
    funding_period_id: fundingPeriodId,
    fiscal_year: "2024-25",
    month,
    date_start: APRIL_START,
    date_end: APRIL_END,
  })
}

async function createCentre(transaction: Knex.Transaction, label: string): Promise<number> {
  const fundingRegionId = await insertRow(transaction, "funding_regions", {
    region: `Child care space linkage ${label}`,
    subsidy_rate: "0.5000",
  })
  return insertRow(transaction, "centres", {
    funding_region_id: fundingRegionId,
    name: `Child care space linkage ${label}`,
    community: "Whitehorse",
    status: "Active",
    is_first_nation_program: false,
  })
}

async function createSubmissionLine(
  transaction: Knex.Transaction,
  attributes: {
    sectionName?: string
    lineName: string
    monthlyAmount?: string
  }
): Promise<number> {
  return insertRow(transaction, "funding_submission_lines", {
    fiscal_year: "2024/25",
    section_name: attributes.sectionName ?? "Administration (10% of Spaces)",
    line_name: attributes.lineName,
    from_age: null,
    to_age: null,
    monthly_amount: attributes.monthlyAmount ?? "100.0000",
  })
}

async function createCategory(
  transaction: Knex.Transaction,
  fundingPeriodId: number,
  attributes: { categoryName: string; deletedAt?: Date }
): Promise<number> {
  return insertRow(transaction, "child_care_space_categories", {
    funding_period_id: fundingPeriodId,
    category_name: attributes.categoryName,
    from_age: 0,
    to_age: 18,
    monthly_amount: "100.0000",
    deleted_at: attributes.deletedAt ?? null,
  })
}

async function createLedgerSpace(
  transaction: Knex.Transaction,
  attributes: {
    centreId: number
    fiscalPeriodId: number
    fundingSubmissionLineId: number
    categoryId: number
    lineName: string
    monthlyAmount: string
    estimatedRate: string
    actualRate: string
  }
): Promise<number> {
  const { id } = await createLegacyChildCareSpace(transaction, {
    centreId: attributes.centreId,
    fiscalPeriodId: attributes.fiscalPeriodId,
    fundingSubmissionLineId: attributes.fundingSubmissionLineId,
    lineName: attributes.lineName,
    monthlyAmount: attributes.monthlyAmount,
    estimatedChildOccupancyRate: attributes.estimatedRate,
    actualChildOccupancyRate: attributes.actualRate,
  })
  await transaction("child_care_spaces")
    .where({ id })
    .update({ category_id: attributes.categoryId })
  return id
}

async function createWorksheet(
  transaction: Knex.Transaction,
  attributes: {
    centreId: number
    lines: WorksheetLine[]
    dateName?: string
  }
): Promise<number> {
  return createWorksheetWithRawValues(transaction, {
    centreId: attributes.centreId,
    values: JSON.stringify(attributes.lines),
    dateName: attributes.dateName ?? "April",
  })
}

async function createWorksheetWithRawValues(
  transaction: Knex.Transaction,
  attributes: {
    centreId: number
    values: string
    dateName?: string
  }
): Promise<number> {
  return insertRow(transaction, "funding_submission_line_jsons", {
    centre_id: attributes.centreId,
    fiscal_year: "2024/25",
    date_name: attributes.dateName ?? "April",
    date_start: APRIL_START,
    date_end: APRIL_END,
    values: attributes.values,
  })
}

function serializeWorksheetLineWithRawSubmissionLineId(
  worksheetLine: WorksheetLine,
  rawSubmissionLineId: string
): string {
  const placeholder = "__raw_submission_line_id__"
  const serializedLine = JSON.stringify({
    ...worksheetLine,
    submissionLineId: placeholder,
  })
  return serializedLine.replace(JSON.stringify(placeholder), rawSubmissionLineId)
}

async function createHistoricalLinkageFixture(
  transaction: Knex.Transaction,
  label: string,
  categoryDeletedAt?: Date
) {
  const fundingPeriodId = await createFundingPeriod(transaction)
  const fiscalPeriodId = await createFiscalPeriod(transaction, fundingPeriodId)
  const centreId = await createCentre(transaction, label)
  const submissionLineId = await createSubmissionLine(transaction, {
    lineName: `Renamed ${label} Line`,
  })
  const categoryAttributes: { categoryName: string; deletedAt?: Date } = {
    categoryName: `Original ${label} Category`,
  }
  if (!isUndefined(categoryDeletedAt)) {
    categoryAttributes.deletedAt = categoryDeletedAt
  }
  const categoryId = await createCategory(transaction, fundingPeriodId, categoryAttributes)
  const historicalLineName = `Historical ${label} Cohort`
  const worksheetLine: WorksheetLine = {
    submissionLineId,
    sectionName: "Administration (10% of Spaces)",
    lineName: historicalLineName,
    monthlyAmount: "125.5000",
    estimatedChildOccupancyRate: "0.4000",
    actualChildOccupancyRate: "0.2000",
    estimatedComputedTotal: "50.2000",
    actualComputedTotal: "25.1000",
    unknownSnapshot: { retained: true },
  }
  await createLedgerSpace(transaction, {
    centreId,
    fiscalPeriodId,
    fundingSubmissionLineId: submissionLineId,
    categoryId,
    lineName: historicalLineName,
    monthlyAmount: "125.5000",
    estimatedRate: "0.4000",
    actualRate: "0.2000",
  })
  return { centreId, submissionLineId, categoryId, worksheetLine }
}

async function createLinkedHistoricalWorksheetFixture(
  transaction: Knex.Transaction,
  label: string
) {
  await unlinkCategories(transaction)
  await addCategoryId(transaction)
  const fixture = await createHistoricalLinkageFixture(transaction, label)
  const worksheetId = await createWorksheet(transaction, {
    centreId: fixture.centreId,
    lines: [fixture.worksheetLine],
  })
  await linkCategories(transaction)
  return { ...fixture, worksheetId }
}

async function readWorksheetLines(
  transaction: Knex.Transaction,
  worksheetId: number
): Promise<WorksheetLine[]> {
  const row = await transaction("funding_submission_line_jsons")
    .select("values")
    .where({ id: worksheetId })
    .first()
  if (isUndefined(row)) {
    throw new Error(`Worksheet ${worksheetId} was not found.`)
  }

  return JSON.parse(row.values)
}

async function findConfigurationLinks(transaction: Knex.Transaction, lineIds: number[]) {
  return transaction("funding_submission_lines")
    .select("id", { categoryId: "child_care_space_category_id" })
    .whereIn("id", lineIds)
}

describe("api/src/db/migrations/20261009024301_link-funding-submission-lines-to-child-care-space-categories.ts", () => {
  describe("#up", () => {
    test("when a historical submission line ID uses integral decimal syntax, links its category", async () => {
      await withLegacyChildCareSpaceSchema(async (transaction) => {
        // Arrange
        await unlinkCategories(transaction)
        await addCategoryId(transaction)
        const fixture = await createHistoricalLinkageFixture(transaction, "decimal identifier")
        const worksheetLine = serializeWorksheetLineWithRawSubmissionLineId(
          fixture.worksheetLine,
          `${fixture.submissionLineId}.0`
        )
        await createWorksheetWithRawValues(transaction, {
          centreId: fixture.centreId,
          values: `[${worksheetLine}]`,
        })

        // Act
        await linkCategories(transaction)

        // Assert
        const configurationLinks = await findConfigurationLinks(transaction, [
          fixture.submissionLineId,
        ])
        expect(configurationLinks).toEqual([
          { id: fixture.submissionLineId, categoryId: fixture.categoryId },
        ])
      })
    })

    test("when a historical submission line ID uses integral exponent syntax, links its category", async () => {
      await withLegacyChildCareSpaceSchema(async (transaction) => {
        // Arrange
        await unlinkCategories(transaction)
        await addCategoryId(transaction)
        const fixture = await createHistoricalLinkageFixture(transaction, "exponent identifier")
        const worksheetLine = serializeWorksheetLineWithRawSubmissionLineId(
          fixture.worksheetLine,
          `${fixture.submissionLineId}e0`
        )
        await createWorksheetWithRawValues(transaction, {
          centreId: fixture.centreId,
          values: `[${worksheetLine}]`,
        })

        // Act
        await linkCategories(transaction)

        // Assert
        const configurationLinks = await findConfigurationLinks(transaction, [
          fixture.submissionLineId,
        ])
        expect(configurationLinks).toEqual([
          { id: fixture.submissionLineId, categoryId: fixture.categoryId },
        ])
      })
    })

    test("when a historical worksheet line ID uses integral decimal syntax, preserves its snapshot and adds category metadata", async () => {
      await withLegacyChildCareSpaceSchema(async (transaction) => {
        // Arrange
        await unlinkCategories(transaction)
        await addCategoryId(transaction)
        const fixture = await createHistoricalLinkageFixture(transaction, "decimal worksheet")
        const worksheetLine = serializeWorksheetLineWithRawSubmissionLineId(
          fixture.worksheetLine,
          `${fixture.submissionLineId}.0`
        )
        const worksheetId = await createWorksheetWithRawValues(transaction, {
          centreId: fixture.centreId,
          values: `[${worksheetLine}]`,
        })

        // Act
        await linkCategories(transaction)

        // Assert
        const worksheetLines = await readWorksheetLines(transaction, worksheetId)
        expect(worksheetLines).toEqual([
          { ...fixture.worksheetLine, childCareSpaceCategoryId: fixture.categoryId },
        ])
      })
    })

    test("when a historical worksheet line ID uses integral exponent syntax, preserves its snapshot and adds category metadata", async () => {
      await withLegacyChildCareSpaceSchema(async (transaction) => {
        // Arrange
        await unlinkCategories(transaction)
        await addCategoryId(transaction)
        const fixture = await createHistoricalLinkageFixture(transaction, "exponent worksheet")
        const worksheetLine = serializeWorksheetLineWithRawSubmissionLineId(
          fixture.worksheetLine,
          `${fixture.submissionLineId}e0`
        )
        const worksheetId = await createWorksheetWithRawValues(transaction, {
          centreId: fixture.centreId,
          values: `[${worksheetLine}]`,
        })

        // Act
        await linkCategories(transaction)

        // Assert
        const worksheetLines = await readWorksheetLines(transaction, worksheetId)
        expect(worksheetLines).toEqual([
          { ...fixture.worksheetLine, childCareSpaceCategoryId: fixture.categoryId },
        ])
      })
    })

    test("when submission line IDs are strings, fractional, tiny fractional, or out of range, does not link historical categories", async () => {
      await withLegacyChildCareSpaceSchema(async (transaction) => {
        // Arrange
        await unlinkCategories(transaction)
        await addCategoryId(transaction)
        const fixture = await createHistoricalLinkageFixture(transaction, "invalid identifiers")
        const invalidWorksheetLines = [
          serializeWorksheetLineWithRawSubmissionLineId(
            fixture.worksheetLine,
            JSON.stringify(String(fixture.submissionLineId))
          ),
          serializeWorksheetLineWithRawSubmissionLineId(
            fixture.worksheetLine,
            `${fixture.submissionLineId}.5`
          ),
          serializeWorksheetLineWithRawSubmissionLineId(
            fixture.worksheetLine,
            `${fixture.submissionLineId}.0000000000000000000000000001`
          ),
          serializeWorksheetLineWithRawSubmissionLineId(fixture.worksheetLine, "2147483648"),
          serializeWorksheetLineWithRawSubmissionLineId(fixture.worksheetLine, "2e2147483647"),
          serializeWorksheetLineWithRawSubmissionLineId(fixture.worksheetLine, "2e-2147483648"),
        ]
        await createWorksheetWithRawValues(transaction, {
          centreId: fixture.centreId,
          values: `[${invalidWorksheetLines.join(",")}]`,
        })

        // Act
        await linkCategories(transaction)

        // Assert
        const configurationLinks = await findConfigurationLinks(transaction, [
          fixture.submissionLineId,
        ])
        expect(configurationLinks).toEqual([{ id: fixture.submissionLineId, categoryId: null }])
      })
    })

    test("when submission line IDs are strings, fractional, or out of range, preserves worksheet metadata unchanged", async () => {
      await withLegacyChildCareSpaceSchema(async (transaction) => {
        // Arrange
        await unlinkCategories(transaction)
        await addCategoryId(transaction)
        const fixture = await createHistoricalLinkageFixture(transaction, "ineligible metadata")
        const stringSnapshot = {
          ...fixture.worksheetLine,
          submissionLineId: String(fixture.submissionLineId),
        }
        const fractionalSnapshot = {
          ...fixture.worksheetLine,
          submissionLineId: fixture.submissionLineId + 0.5,
        }
        const tinyFractionalSnapshot = { ...fixture.worksheetLine }
        const outOfRangeSnapshot = {
          ...fixture.worksheetLine,
          submissionLineId: 2147483648,
        }
        const rawWorksheetLines = [
          serializeWorksheetLineWithRawSubmissionLineId(
            fixture.worksheetLine,
            JSON.stringify(String(fixture.submissionLineId))
          ),
          serializeWorksheetLineWithRawSubmissionLineId(
            fixture.worksheetLine,
            `${fixture.submissionLineId}.5`
          ),
          serializeWorksheetLineWithRawSubmissionLineId(
            fixture.worksheetLine,
            `${fixture.submissionLineId}.0000000000000000000000000001`
          ),
          serializeWorksheetLineWithRawSubmissionLineId(fixture.worksheetLine, "2147483648"),
        ]
        const worksheetId = await createWorksheetWithRawValues(transaction, {
          centreId: fixture.centreId,
          values: `[${rawWorksheetLines.join(",")}]`,
        })

        // Act
        await linkCategories(transaction)

        // Assert
        const worksheetLines = await readWorksheetLines(transaction, worksheetId)
        expect(worksheetLines).toEqual([
          stringSnapshot,
          fractionalSnapshot,
          tinyFractionalSnapshot,
          outOfRangeSnapshot,
        ])
      })
    })

    test("when numeric worksheet lines match exact current categories, adds metadata without changing snapshots", async () => {
      await withLegacyChildCareSpaceSchema(async (transaction) => {
        // Arrange
        await unlinkCategories(transaction)
        await addCategoryId(transaction)
        const fundingPeriodId = await createFundingPeriod(transaction)
        const aprilPeriodId = await createFiscalPeriod(transaction, fundingPeriodId)
        const centreId = await createCentre(transaction, "eligible-centre")
        const infantLineId = await createSubmissionLine(transaction, { lineName: "Infants" })
        const toddlerLineId = await createSubmissionLine(transaction, {
          sectionName: "Quality Enhancement Program",
          lineName: "Toddlers",
        })
        const infantCategoryId = await createCategory(transaction, fundingPeriodId, {
          categoryName: "Infants",
        })
        const toddlerCategoryId = await createCategory(transaction, fundingPeriodId, {
          categoryName: "Toddlers",
        })
        await createLedgerSpace(transaction, {
          centreId,
          fiscalPeriodId: aprilPeriodId,
          fundingSubmissionLineId: infantLineId,
          categoryId: infantCategoryId,
          lineName: "Historical Infant Cohort",
          monthlyAmount: "125.5000",
          estimatedRate: "0.4000",
          actualRate: "0.2000",
        })
        await createLedgerSpace(transaction, {
          centreId,
          fiscalPeriodId: aprilPeriodId,
          fundingSubmissionLineId: toddlerLineId,
          categoryId: toddlerCategoryId,
          lineName: "Historical Toddler Cohort",
          monthlyAmount: "90.0000",
          estimatedRate: "0.5000",
          actualRate: "0.2500",
        })

        const infantSnapshot: WorksheetLine = {
          submissionLineId: infantLineId,
          sectionName: "Administration (10% of Spaces)",
          lineName: "Historical Infant Cohort",
          monthlyAmount: "125.5000",
          estimatedChildOccupancyRate: "0.4000",
          actualChildOccupancyRate: "0.2000",
          estimatedComputedTotal: "50.2000",
          actualComputedTotal: "25.1000",
          unknownSnapshot: { retained: true },
        }
        const toddlerSnapshot: WorksheetLine = {
          submissionLineId: toddlerLineId,
          sectionName: "Quality Enhancement Program",
          lineName: "Historical Toddler Cohort",
          monthlyAmount: "90.0000",
          estimatedChildOccupancyRate: "0.5000",
          actualChildOccupancyRate: "0.2500",
          estimatedComputedTotal: "45.0000",
          actualComputedTotal: "22.5000",
          otherHistoricalField: "keep me",
        }
        const stringIdSnapshot: WorksheetLine = {
          ...infantSnapshot,
          submissionLineId: String(infantLineId),
        }
        const nullIdSnapshot: WorksheetLine = {
          ...infantSnapshot,
          submissionLineId: null,
        }
        const wrongSectionSnapshot: WorksheetLine = {
          ...infantSnapshot,
          sectionName: "administration (10% of Spaces)",
        }
        const paddedPropertySnapshot: WorksheetLine = {
          ...infantSnapshot,
          submissionLineId: String(infantLineId),
          "submissionLineId ": toddlerLineId,
        }
        const eligibleWorksheetId = await createWorksheet(transaction, {
          centreId,
          lines: [
            infantSnapshot,
            toddlerSnapshot,
            stringIdSnapshot,
            nullIdSnapshot,
            wrongSectionSnapshot,
            paddedPropertySnapshot,
          ],
        })

        // Act
        await linkCategories(transaction)

        // Assert
        const eligibleWorksheetLines = await readWorksheetLines(transaction, eligibleWorksheetId)
        expect(eligibleWorksheetLines).toEqual([
          { ...infantSnapshot, childCareSpaceCategoryId: infantCategoryId },
          { ...toddlerSnapshot, childCareSpaceCategoryId: toddlerCategoryId },
          stringIdSnapshot,
          nullIdSnapshot,
          wrongSectionSnapshot,
          paddedPropertySnapshot,
        ])
      })
    })

    test("when a current category name exactly matches its funding line, links the category", async () => {
      await withLegacyChildCareSpaceSchema(async (transaction) => {
        // Arrange
        await unlinkCategories(transaction)
        await addCategoryId(transaction)
        const fundingPeriodId = await createFundingPeriod(transaction)
        const submissionLineId = await createSubmissionLine(transaction, {
          lineName: "Infants",
        })
        const categoryId = await createCategory(transaction, fundingPeriodId, {
          categoryName: "Infants",
        })

        // Act
        await linkCategories(transaction)

        // Assert
        const configurationLinks = await findConfigurationLinks(transaction, [submissionLineId])
        expect(configurationLinks).toEqual([{ id: submissionLineId, categoryId }])
      })
    })

    test("when a current category name differs only by case, leaves the funding line unlinked", async () => {
      await withLegacyChildCareSpaceSchema(async (transaction) => {
        // Arrange
        await unlinkCategories(transaction)
        await addCategoryId(transaction)
        const fundingPeriodId = await createFundingPeriod(transaction)
        const submissionLineId = await createSubmissionLine(transaction, {
          lineName: "Infants",
        })
        await createCategory(transaction, fundingPeriodId, {
          categoryName: "infants",
        })

        // Act
        await linkCategories(transaction)

        // Assert
        const configurationLinks = await findConfigurationLinks(transaction, [submissionLineId])
        expect(configurationLinks).toEqual([{ id: submissionLineId, categoryId: null }])
      })
    })

    test("when a worksheet belongs to another centre, leaves its category metadata unchanged", async () => {
      await withLegacyChildCareSpaceSchema(async (transaction) => {
        // Arrange
        await unlinkCategories(transaction)
        await addCategoryId(transaction)
        const fixture = await createHistoricalLinkageFixture(transaction, "other centre")
        await createWorksheet(transaction, {
          centreId: fixture.centreId,
          lines: [fixture.worksheetLine],
        })
        const otherCentreId = await createCentre(transaction, "unlinked centre")
        const otherCentreWorksheetId = await createWorksheet(transaction, {
          centreId: otherCentreId,
          lines: [fixture.worksheetLine],
        })

        // Act
        await linkCategories(transaction)

        // Assert
        const otherCentreWorksheetLines = await readWorksheetLines(
          transaction,
          otherCentreWorksheetId
        )
        expect(otherCentreWorksheetLines).toEqual([fixture.worksheetLine])
      })
    })

    test("when a worksheet belongs to another month, leaves its category metadata unchanged", async () => {
      await withLegacyChildCareSpaceSchema(async (transaction) => {
        // Arrange
        await unlinkCategories(transaction)
        await addCategoryId(transaction)
        const fixture = await createHistoricalLinkageFixture(transaction, "other month")
        await createWorksheet(transaction, {
          centreId: fixture.centreId,
          lines: [fixture.worksheetLine],
        })
        const otherMonthWorksheetId = await createWorksheet(transaction, {
          centreId: fixture.centreId,
          dateName: "May",
          lines: [fixture.worksheetLine],
        })

        // Act
        await linkCategories(transaction)

        // Assert
        const otherMonthWorksheetLines = await readWorksheetLines(
          transaction,
          otherMonthWorksheetId
        )
        expect(otherMonthWorksheetLines).toEqual([fixture.worksheetLine])
      })
    })

    test("when only a retired historical category matches a renamed line, links that category", async () => {
      await withLegacyChildCareSpaceSchema(async (transaction) => {
        // Arrange
        await unlinkCategories(transaction)
        await addCategoryId(transaction)
        const fundingPeriodId = await createFundingPeriod(transaction)
        const fiscalPeriodId = await createFiscalPeriod(transaction, fundingPeriodId)
        const centreId = await createCentre(transaction, "retired-category")
        const submissionLineId = await createSubmissionLine(transaction, {
          lineName: "Renamed Infant Group",
        })
        const retiredCategoryId = await createCategory(transaction, fundingPeriodId, {
          categoryName: "Original Infant Group",
          deletedAt: new Date("2025-01-01T00:00:00Z"),
        })
        await createLedgerSpace(transaction, {
          centreId,
          fiscalPeriodId,
          fundingSubmissionLineId: submissionLineId,
          categoryId: retiredCategoryId,
          lineName: "Historical Infant Cohort",
          monthlyAmount: "125.5000",
          estimatedRate: "0.4000",
          actualRate: "0.2000",
        })
        const worksheetSnapshot: WorksheetLine = {
          submissionLineId,
          sectionName: "Administration (10% of Spaces)",
          lineName: "Historical Infant Cohort",
          monthlyAmount: "125.5000",
          estimatedComputedTotal: "50.2000",
          actualComputedTotal: "25.1000",
        }
        await createWorksheet(transaction, {
          centreId,
          lines: [worksheetSnapshot],
        })

        // Act
        await linkCategories(transaction)

        // Assert
        const configurationLinks = await findConfigurationLinks(transaction, [submissionLineId])
        expect(configurationLinks).toEqual([
          { id: submissionLineId, categoryId: retiredCategoryId },
        ])
      })
    })

    test("when only a retired historical category matches a renamed worksheet line, adds its category metadata", async () => {
      await withLegacyChildCareSpaceSchema(async (transaction) => {
        // Arrange
        await unlinkCategories(transaction)
        await addCategoryId(transaction)
        const fixture = await createHistoricalLinkageFixture(
          transaction,
          "retired metadata",
          new Date("2025-01-01T00:00:00Z")
        )
        const worksheetId = await createWorksheet(transaction, {
          centreId: fixture.centreId,
          lines: [fixture.worksheetLine],
        })

        // Act
        await linkCategories(transaction)

        // Assert
        const worksheetLines = await readWorksheetLines(transaction, worksheetId)
        expect(worksheetLines).toEqual([
          { ...fixture.worksheetLine, childCareSpaceCategoryId: fixture.categoryId },
        ])
      })
    })

    test("when a current category conflicts with historical linkage, rolls back the migration", async () => {
      await withLegacyChildCareSpaceSchema(async (transaction) => {
        // Arrange
        await unlinkCategories(transaction)
        await addCategoryId(transaction)
        const fundingPeriodId = await createFundingPeriod(transaction)
        const fiscalPeriodId = await createFiscalPeriod(transaction, fundingPeriodId)
        const centreId = await createCentre(transaction, "conflicting-categories")
        const stableLineId = await createSubmissionLine(transaction, { lineName: "Toddlers" })
        const conflictingLineId = await createSubmissionLine(transaction, { lineName: "Infants" })
        const toddlerCategoryId = await createCategory(transaction, fundingPeriodId, {
          categoryName: "Toddlers",
        })
        await createCategory(transaction, fundingPeriodId, { categoryName: "Infants" })
        const retiredInfantCategoryId = await createCategory(transaction, fundingPeriodId, {
          categoryName: "Original Infants",
          deletedAt: new Date("2025-01-01T00:00:00Z"),
        })
        await createLedgerSpace(transaction, {
          centreId,
          fiscalPeriodId,
          fundingSubmissionLineId: stableLineId,
          categoryId: toddlerCategoryId,
          lineName: "Historical Toddler Cohort",
          monthlyAmount: "90.0000",
          estimatedRate: "0.5000",
          actualRate: "0.2500",
        })
        await createLedgerSpace(transaction, {
          centreId,
          fiscalPeriodId,
          fundingSubmissionLineId: conflictingLineId,
          categoryId: retiredInfantCategoryId,
          lineName: "Historical Infant Cohort",
          monthlyAmount: "125.5000",
          estimatedRate: "0.4000",
          actualRate: "0.2000",
        })
        const worksheetSnapshots: WorksheetLine[] = [
          {
            submissionLineId: stableLineId,
            sectionName: "Administration (10% of Spaces)",
            lineName: "Historical Toddler Cohort",
            monthlyAmount: "90.0000",
            estimatedComputedTotal: "45.0000",
          },
          {
            submissionLineId: conflictingLineId,
            sectionName: "Administration (10% of Spaces)",
            lineName: "Historical Infant Cohort",
            monthlyAmount: "125.5000",
            estimatedComputedTotal: "50.2000",
          },
        ]
        await createWorksheet(transaction, {
          centreId,
          lines: worksheetSnapshots,
        })

        // Act
        const migrationColumnAfterAttempt = await transaction
          .transaction((nestedTransaction) => linkCategories(nestedTransaction))
          .then(
            () => "migration completed despite ambiguous category matches",
            async () =>
              (await transaction("funding_submission_lines").columnInfo())
                .child_care_space_category_id
          )

        // Assert
        expect(migrationColumnAfterAttempt).toBeUndefined()
      })
    })
  })

  describe("#down", () => {
    test("when the migration-created foreign key is present, removes it with the linkage column", async () => {
      await withLegacyChildCareSpaceSchema(async (transaction) => {
        // Arrange
        await createLinkedHistoricalWorksheetFixture(transaction, "native down")

        // Act
        await unlinkCategories(transaction)

        // Assert
        const submissionLineColumns = await transaction("funding_submission_lines").columnInfo()
        expect(submissionLineColumns.child_care_space_category_id).toBeUndefined()
      })
    })

    test("when the migration is reversed, preserves historical worksheet metadata", async () => {
      await withLegacyChildCareSpaceSchema(async (transaction) => {
        // Arrange
        const fixture = await createLinkedHistoricalWorksheetFixture(transaction, "worksheet down")

        // Act
        await unlinkCategories(transaction)

        // Assert
        const worksheetLines = await readWorksheetLines(transaction, fixture.worksheetId)
        expect(worksheetLines).toEqual([
          { ...fixture.worksheetLine, childCareSpaceCategoryId: fixture.categoryId },
        ])
      })
    })

    test("when the migration is reversed, preserves historical ledger rows unchanged", async () => {
      await withLegacyChildCareSpaceSchema(async (transaction) => {
        // Arrange
        await unlinkCategories(transaction)
        await addCategoryId(transaction)
        const fixture = await createHistoricalLinkageFixture(transaction, "ledger down")
        await createWorksheet(transaction, {
          centreId: fixture.centreId,
          lines: [fixture.worksheetLine],
        })
        await linkCategories(transaction)
        const originalLedgerRows = await transaction("child_care_spaces").select("*")

        // Act
        await unlinkCategories(transaction)

        // Assert
        const ledgerRows = await transaction("child_care_spaces").select("*")
        expect(ledgerRows).toEqual(originalLedgerRows)
      })
    })

    test("when Knex created the foreign key, removes it with the linkage column", async () => {
      await withLegacyChildCareSpaceSchema(async (transaction) => {
        // Arrange
        await unlinkCategories(transaction)
        await addCategoryId(transaction)
        const fundingPeriodId = await createFundingPeriod(transaction)
        const submissionLineId = await createSubmissionLine(transaction, { lineName: "Infants" })
        const categoryId = await createCategory(transaction, fundingPeriodId, {
          categoryName: "Infants",
        })
        await transaction.schema.alterTable("funding_submission_lines", (table) => {
          table.integer("child_care_space_category_id").nullable()
          table.foreign("child_care_space_category_id").references("child_care_space_categories.id")
        })
        await transaction("funding_submission_lines")
          .where({ id: submissionLineId })
          .update({ child_care_space_category_id: categoryId })

        // Act
        await unlinkCategories(transaction)

        // Assert
        const submissionLineColumns = await transaction("funding_submission_lines").columnInfo()
        expect(submissionLineColumns.child_care_space_category_id).toBeUndefined()
      })
    })
  })
})
