import type { Knex } from "knex"
import { isUndefined } from "lodash"

import {
  down as unlinkCategories,
  up as linkCategories,
} from "@/db/migrations/20261009024301_link-funding-submission-lines-to-child-care-space-categories"
import { up as addCategoryId } from "@/db/migrations/20261009021603_add-category-id-to-child-care-spaces"
import {
  createLegacyChildCareSpace,
  findLegacyChildCareSpaces,
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
  return insertRow(transaction, "funding_submission_line_jsons", {
    centre_id: attributes.centreId,
    fiscal_year: "2024/25",
    date_name: attributes.dateName ?? "April",
    date_start: APRIL_START,
    date_end: APRIL_END,
    values: JSON.stringify(attributes.lines),
  })
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
    .orderBy("id")
}

async function findSubmissionLineFacts(transaction: Knex.Transaction, lineIds: number[]) {
  return transaction("funding_submission_lines")
    .select(
      "id",
      { fiscalYear: "fiscal_year" },
      { sectionName: "section_name" },
      { lineName: "line_name" },
      { monthlyAmount: "monthly_amount" }
    )
    .whereIn("id", lineIds)
    .orderBy("id")
}

describe("api/src/db/migrations/20261009024301_link-funding-submission-lines-to-child-care-space-categories.ts", () => {
  describe("#up", () => {
    test("when multiple eligible worksheet lines exist, preserves snapshots and skips ineligible metadata", async () => {
      await withLegacyChildCareSpaceSchema(async (transaction) => {
        // Arrange
        await unlinkCategories(transaction)
        await addCategoryId(transaction)
        const fundingPeriodId = await createFundingPeriod(transaction)
        const aprilPeriodId = await createFiscalPeriod(transaction, fundingPeriodId)
        const centreId = await createCentre(transaction, "eligible-centre")
        const otherCentreId = await createCentre(transaction, "other-centre")
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
        const otherCentreSnapshot = { ...infantSnapshot }
        const otherCentreWorksheetId = await createWorksheet(transaction, {
          centreId: otherCentreId,
          lines: [otherCentreSnapshot],
        })
        const otherMonthSnapshot = { ...infantSnapshot }
        const otherMonthWorksheetId = await createWorksheet(transaction, {
          centreId,
          dateName: "May",
          lines: [otherMonthSnapshot],
        })

        // Act
        await linkCategories(transaction)

        // Assert
        const configurationLinks = await findConfigurationLinks(transaction, [
          infantLineId,
          toddlerLineId,
        ])
        const eligibleWorksheetLines = await readWorksheetLines(transaction, eligibleWorksheetId)
        const otherCentreWorksheetLines = await readWorksheetLines(
          transaction,
          otherCentreWorksheetId
        )
        const otherMonthWorksheetLines = await readWorksheetLines(
          transaction,
          otherMonthWorksheetId
        )
        expect({
          configurationLinks,
          eligibleWorksheetLines,
          otherCentreWorksheetLines,
          otherMonthWorksheetLines,
        }).toEqual({
          configurationLinks: [
            { id: infantLineId, categoryId: infantCategoryId },
            { id: toddlerLineId, categoryId: toddlerCategoryId },
          ],
          eligibleWorksheetLines: [
            { ...infantSnapshot, childCareSpaceCategoryId: infantCategoryId },
            { ...toddlerSnapshot, childCareSpaceCategoryId: toddlerCategoryId },
            stringIdSnapshot,
            nullIdSnapshot,
            wrongSectionSnapshot,
            paddedPropertySnapshot,
          ],
          otherCentreWorksheetLines: [otherCentreSnapshot],
          otherMonthWorksheetLines: [otherMonthSnapshot],
        })
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
        const worksheetId = await createWorksheet(transaction, {
          centreId,
          lines: [worksheetSnapshot],
        })

        // Act
        await linkCategories(transaction)

        // Assert
        const configurationLinks = await findConfigurationLinks(transaction, [submissionLineId])
        const worksheetLines = await readWorksheetLines(transaction, worksheetId)
        expect({ configurationLinks, worksheetLines }).toEqual({
          configurationLinks: [{ id: submissionLineId, categoryId: retiredCategoryId }],
          worksheetLines: [{ ...worksheetSnapshot, childCareSpaceCategoryId: retiredCategoryId }],
        })
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
        const worksheetId = await createWorksheet(transaction, {
          centreId,
          lines: worksheetSnapshots,
        })
        const originalSubmissionLineFacts = await findSubmissionLineFacts(transaction, [
          stableLineId,
          conflictingLineId,
        ])
        const originalWorksheetLines = await readWorksheetLines(transaction, worksheetId)
        const originalLedgerFacts = await findLegacyChildCareSpaces(transaction)

        // Act
        await expect(
          transaction.transaction((nestedTransaction) => linkCategories(nestedTransaction))
        ).rejects.toThrow()

        // Assert
        const submissionLineColumns = await transaction("funding_submission_lines").columnInfo()
        const submissionLineFacts = await findSubmissionLineFacts(transaction, [
          stableLineId,
          conflictingLineId,
        ])
        const worksheetLines = await readWorksheetLines(transaction, worksheetId)
        const ledgerFacts = await findLegacyChildCareSpaces(transaction)
        expect({
          linkageColumn: submissionLineColumns.child_care_space_category_id,
          submissionLineFacts,
          worksheetLines,
          ledgerFacts,
        }).toEqual({
          linkageColumn: undefined,
          submissionLineFacts: originalSubmissionLineFacts,
          worksheetLines: originalWorksheetLines,
          ledgerFacts: originalLedgerFacts,
        })
      })
    })
  })

  describe("#down", () => {
    test("when the migration created the foreign key, drops it and retains worksheet and ledger facts", async () => {
      await withLegacyChildCareSpaceSchema(async (transaction) => {
        // Arrange
        await unlinkCategories(transaction)
        await addCategoryId(transaction)
        const fundingPeriodId = await createFundingPeriod(transaction)
        const fiscalPeriodId = await createFiscalPeriod(transaction, fundingPeriodId)
        const centreId = await createCentre(transaction, "sql-foreign-key")
        const submissionLineId = await createSubmissionLine(transaction, { lineName: "Infants" })
        const categoryId = await createCategory(transaction, fundingPeriodId, {
          categoryName: "Infants",
        })
        await createLedgerSpace(transaction, {
          centreId,
          fiscalPeriodId,
          fundingSubmissionLineId: submissionLineId,
          categoryId,
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
        const worksheetId = await createWorksheet(transaction, {
          centreId,
          lines: [worksheetSnapshot],
        })

        await linkCategories(transaction)
        const linkedWorksheetLines = [
          { ...worksheetSnapshot, childCareSpaceCategoryId: categoryId },
        ]
        const ledgerFactsBeforeDown = await findLegacyChildCareSpaces(transaction)

        // Act
        await unlinkCategories(transaction)

        // Assert
        const submissionLineColumns = await transaction("funding_submission_lines").columnInfo()
        const worksheetLines = await readWorksheetLines(transaction, worksheetId)
        const ledgerFacts = await findLegacyChildCareSpaces(transaction)
        expect({
          linkageColumn: submissionLineColumns.child_care_space_category_id,
          worksheetLines,
          ledgerFacts,
        }).toEqual({
          linkageColumn: undefined,
          worksheetLines: linkedWorksheetLines,
          ledgerFacts: ledgerFactsBeforeDown,
        })
      })
    })

    test("when Knex generated the foreign key, drops it without changing worksheet or ledger facts", async () => {
      await withLegacyChildCareSpaceSchema(async (transaction) => {
        // Arrange
        await unlinkCategories(transaction)
        await addCategoryId(transaction)
        const fundingPeriodId = await createFundingPeriod(transaction)
        const fiscalPeriodId = await createFiscalPeriod(transaction, fundingPeriodId)
        const centreId = await createCentre(transaction, "knex-foreign-key")
        const submissionLineId = await createSubmissionLine(transaction, { lineName: "Infants" })
        const categoryId = await createCategory(transaction, fundingPeriodId, {
          categoryName: "Infants",
        })
        await createLedgerSpace(transaction, {
          centreId,
          fiscalPeriodId,
          fundingSubmissionLineId: submissionLineId,
          categoryId,
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
          childCareSpaceCategoryId: categoryId,
          estimatedComputedTotal: "50.2000",
          actualComputedTotal: "25.1000",
          unknownSnapshot: { retained: true },
        }
        const worksheetId = await createWorksheet(transaction, {
          centreId,
          lines: [worksheetSnapshot],
        })
        await transaction.schema.alterTable("funding_submission_lines", (table) => {
          table.integer("child_care_space_category_id").nullable()
          table.foreign("child_care_space_category_id").references("child_care_space_categories.id")
        })
        await transaction("funding_submission_lines")
          .where({ id: submissionLineId })
          .update({ child_care_space_category_id: categoryId })
        const originalSubmissionLineFacts = await findSubmissionLineFacts(transaction, [
          submissionLineId,
        ])
        const originalWorksheetLines = await readWorksheetLines(transaction, worksheetId)
        const originalLedgerFacts = await findLegacyChildCareSpaces(transaction)

        // Act
        await unlinkCategories(transaction)

        // Assert
        const submissionLineColumns = await transaction("funding_submission_lines").columnInfo()
        const submissionLineFacts = await findSubmissionLineFacts(transaction, [submissionLineId])
        const worksheetLines = await readWorksheetLines(transaction, worksheetId)
        const ledgerFacts = await findLegacyChildCareSpaces(transaction)
        expect({
          linkageColumn: submissionLineColumns.child_care_space_category_id,
          submissionLineFacts,
          worksheetLines,
          ledgerFacts,
        }).toEqual({
          linkageColumn: undefined,
          submissionLineFacts: originalSubmissionLineFacts,
          worksheetLines: originalWorksheetLines,
          ledgerFacts: originalLedgerFacts,
        })
      })
    })
  })
})
