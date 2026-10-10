import Big from "big.js"
import type { Knex } from "knex"

import { up as migrateWorksheetValues } from "@/db/migrations/20261007174315_migrate-child-care-spaces-from-worksheet-json"
import { up as addCategoryId } from "@/db/migrations/20261009021603_add-category-id-to-child-care-spaces"
import { up as backfillCategories } from "@/db/migrations/20261009021607_backfill-child-care-space-categories"
import { up as replaceLegacyReference } from "@/db/migrations/20261009021610_replace-child-care-spaces-funding-submission-line-id-with-category-id"
import { up as removeLegacyConfiguration } from "@/db/migrations/20261009021613_remove-child-care-spaces-from-funding-submission-lines"
import { up as linkCategories } from "@/db/migrations/20261009024301_link-funding-submission-lines-to-child-care-space-categories"
import {
  createLegacyChildCareSpace,
  findLegacyChildCareSpaces,
  withLegacyChildCareSpaceSchema,
} from "@/db/migrations/legacy-child-care-spaces"

const APRIL_START = new Date("2024-04-01T00:00:00Z")
const APRIL_END = new Date("2024-04-30T23:59:59Z")
type IdRow = { id: number }

async function insertRow(
  transaction: Knex.Transaction,
  tableName: string,
  attributes: Record<string, unknown>
): Promise<number> {
  const [row] = await transaction(tableName).insert(attributes).returning<IdRow[]>("id")
  if (row === undefined) throw new Error(`Unable to insert fixture row into ${tableName}.`)

  return row.id
}

async function createFundingPeriod(
  transaction: Knex.Transaction,
  fiscalYear: string
): Promise<number> {
  const [startYear] = fiscalYear.split("-").map(Number)
  return insertRow(transaction, "funding_periods", {
    fiscal_year: fiscalYear,
    from_date: new Date(`${startYear}-04-01T00:00:00Z`),
    to_date: new Date(`${startYear + 1}-03-31T23:59:59Z`),
    title: `Fixture Funding Period ${fiscalYear}`,
  })
}

async function createFiscalPeriod(
  transaction: Knex.Transaction,
  fundingPeriodId: number,
  fiscalYear = "2024-25",
  month = "April"
): Promise<number> {
  return insertRow(transaction, "fiscal_periods", {
    funding_period_id: fundingPeriodId,
    fiscal_year: fiscalYear,
    month,
    date_start: APRIL_START,
    date_end: APRIL_END,
  })
}

async function createCentre(transaction: Knex.Transaction): Promise<number> {
  const fundingRegionId = await insertRow(transaction, "funding_regions", {
    region: `Fixture Region ${Date.now()} ${Math.random()}`,
    subsidy_rate: "0.5000",
  })
  return insertRow(transaction, "centres", {
    funding_region_id: fundingRegionId,
    name: "Migration Fixture Centre",
    community: "Whitehorse",
    status: "Active",
    is_first_nation_program: false,
  })
}

async function createFundingSubmissionLine(
  transaction: Knex.Transaction,
  attributes: {
    fiscalYear?: string
    sectionName?: string
    lineName?: string
    fromAge?: number | null
    toAge?: number | null
    monthlyAmount?: string
  } = {}
): Promise<number> {
  return insertRow(transaction, "funding_submission_lines", {
    fiscal_year: attributes.fiscalYear ?? "2024/25",
    section_name: attributes.sectionName ?? "Child Care Spaces",
    line_name: attributes.lineName ?? "Infants",
    from_age: attributes.fromAge ?? null,
    to_age: attributes.toAge ?? null,
    monthly_amount: attributes.monthlyAmount ?? "100.0000",
  })
}

async function createWorksheet(
  transaction: Knex.Transaction,
  centreId: number,
  lines: Record<string, unknown>[],
  fiscalYear = "2024/25"
): Promise<number> {
  return insertRow(transaction, "funding_submission_line_jsons", {
    centre_id: centreId,
    fiscal_year: fiscalYear,
    date_name: "April",
    date_start: APRIL_START,
    date_end: APRIL_END,
    values: JSON.stringify(lines),
  })
}

async function readWorksheetLines(transaction: Knex.Transaction, worksheetId: number) {
  const row = await transaction("funding_submission_line_jsons")
    .select("values")
    .where({ id: worksheetId })
    .first()
  if (row === undefined) throw new Error(`Worksheet ${worksheetId} was not found.`)
  return JSON.parse(row.values) as Record<string, unknown>[]
}

async function createLegacySpace(
  transaction: Knex.Transaction,
  values: {
    centreId: number
    fiscalPeriodId: number
    fundingSubmissionLineId: number
    lineName: string
    monthlyAmount: string
    estimatedRate: string
    actualRate: string
  }
) {
  return createLegacyChildCareSpace(transaction, {
    centreId: values.centreId,
    fiscalPeriodId: values.fiscalPeriodId,
    fundingSubmissionLineId: values.fundingSubmissionLineId,
    lineName: values.lineName,
    monthlyAmount: values.monthlyAmount,
    estimatedChildOccupancyRate: values.estimatedRate,
    actualChildOccupancyRate: values.actualRate,
  })
}

async function findCategories(transaction: Knex.Transaction) {
  const rows = await transaction("child_care_space_categories")
    .select(
      "id",
      { fundingPeriodId: "funding_period_id" },
      { categoryName: "category_name" },
      { fromAge: "from_age" },
      { toAge: "to_age" },
      { monthlyAmount: "monthly_amount" },
      { deletedAt: "deleted_at" }
    )
    .orderBy("funding_period_id")
    .orderBy("category_name")
  return rows.map((row) => ({ ...row, monthlyAmount: Big(row.monthlyAmount).toString() }))
}

async function findSpaces(transaction: Knex.Transaction) {
  const rows = await transaction("child_care_spaces")
    .select(
      "id",
      { categoryId: "category_id" },
      { lineName: "line_name" },
      { monthlyAmount: "monthly_amount" },
      { estimatedChildOccupancyRate: "estimated_child_occupancy_rate" },
      { actualChildOccupancyRate: "actual_child_occupancy_rate" },
      { estimatedComputedTotal: "estimated_computed_total" },
      { actualComputedTotal: "actual_computed_total" }
    )
    .orderBy("id")
  return rows.map((row) => ({
    ...row,
    monthlyAmount: Big(row.monthlyAmount).toString(),
    estimatedChildOccupancyRate: Big(row.estimatedChildOccupancyRate).toString(),
    actualChildOccupancyRate: Big(row.actualChildOccupancyRate).toString(),
    estimatedComputedTotal: Big(row.estimatedComputedTotal).toString(),
    actualComputedTotal: Big(row.actualComputedTotal).toString(),
  }))
}

async function findConfiguration(transaction: Knex.Transaction) {
  return transaction("funding_submission_lines")
    .select(
      "id",
      { sectionName: "section_name" },
      { lineName: "line_name" },
      { childCareSpaceCategoryId: "child_care_space_category_id" },
      { deletedAt: "deleted_at" }
    )
    .orderBy("id")
}

describe("api/src/db/migrations/20261009021607_backfill-child-care-space-categories.ts", () => {
  describe("#up", () => {
    test("when historical space and JSON labels differ, links administration metadata by category ID", async () => {
      await withLegacyChildCareSpaceSchema(async (transaction) => {
        // Arrange
        const fundingPeriodId = await createFundingPeriod(transaction, "2024-2025")
        const fiscalPeriodId = await createFiscalPeriod(transaction, fundingPeriodId)
        const centreId = await createCentre(transaction)
        const fundingSubmissionLine1Id = await createFundingSubmissionLine(transaction, {
          lineName: "Infants",
          fromAge: 0,
          toAge: 18,
          monthlyAmount: "100.0000",
        })
        const fundingSubmissionLine2Id = await createFundingSubmissionLine(transaction, {
          fiscalYear: "2025/26",
          sectionName: "Archived Child Care Spaces",
          lineName: "Retired Toddlers",
          fromAge: 19,
          toAge: 36,
          monthlyAmount: "80.0000",
        })
        await transaction("funding_submission_lines")
          .where({ id: fundingSubmissionLine2Id })
          .update({ deleted_at: new Date("2026-10-09T00:00:00Z") })
        const administrationLineId = await createFundingSubmissionLine(transaction, {
          sectionName: "Administration (10% of Spaces)",
          lineName: "Infants",
          monthlyAmount: "10.0000",
        })
        const legacyChildCareSpace = await createLegacySpace(transaction, {
          centreId,
          fiscalPeriodId,
          fundingSubmissionLineId: fundingSubmissionLine2Id,
          lineName: "Historical Toddler Cohort",
          monthlyAmount: "125.5000",
          estimatedRate: "0.4000",
          actualRate: "0.2000",
        })
        const retainedLine = {
          submissionLineId: administrationLineId,
          sectionName: "Administration (10% of Spaces)",
          lineName: "Infants",
          monthlyAmount: "10.0000",
          actualComputedTotal: "1.0000",
        }
        const worksheetId = await createWorksheet(transaction, centreId, [
          {
            submissionLineId: fundingSubmissionLine1Id,
            sectionName: "Child Care Spaces",
            lineName: "Historical Infant Cohort",
            monthlyAmount: "250.0000",
            estimatedChildOccupancyRate: "0.5000",
            actualChildOccupancyRate: "0.1000",
            estimatedComputedTotal: "125.0000",
            actualComputedTotal: "25.0000",
          },
          retainedLine,
        ])
        await migrateWorksheetValues(transaction)
        const snapshotsBefore = await findLegacyChildCareSpaces(transaction)
        await addCategoryId(transaction)

        // Act
        await backfillCategories(transaction)
        await backfillCategories(transaction)
        const snapshotsAfter = await findLegacyChildCareSpaces(transaction)
        await replaceLegacyReference(transaction)
        await removeLegacyConfiguration(transaction)
        await transaction.schema.alterTable("funding_submission_lines", (table) => {
          table.dropForeign("child_care_space_category_id")
          table.dropColumn("child_care_space_category_id")
        })
        await linkCategories(transaction)

        // Assert
        const categories = await findCategories(transaction)
        const spaces = await findSpaces(transaction)
        const configuration = await findConfiguration(transaction)
        const ledgerColumns = await transaction("child_care_spaces").columnInfo()
        const categoryColumns = await transaction("child_care_space_categories").columnInfo()
        const worksheetLines = await readWorksheetLines(transaction, worksheetId)
        expect({
          snapshotsBefore,
          snapshotsAfter,
          categories,
          spaces,
          worksheetLines,
          configuration,
          legacyColumn: ledgerColumns.funding_submission_line_id,
          temporaryColumn: categoryColumns.source_funding_submission_line_id,
        }).toEqual({
          snapshotsBefore,
          snapshotsAfter: snapshotsBefore,
          categories: [
            expect.objectContaining({
              fundingPeriodId,
              categoryName: "Infants",
              fromAge: 0,
              toAge: 18,
              monthlyAmount: "100",
              deletedAt: null,
            }),
            expect.objectContaining({
              fundingPeriodId,
              categoryName: "Retired Toddlers",
              fromAge: 19,
              toAge: 36,
              monthlyAmount: "80",
              deletedAt: expect.anything(),
            }),
          ],
          spaces: [
            expect.objectContaining({
              id: legacyChildCareSpace.id,
              categoryId: categories[1].id,
              lineName: "Historical Toddler Cohort",
              monthlyAmount: "125.5",
              estimatedChildOccupancyRate: "0.4",
              actualChildOccupancyRate: "0.2",
              estimatedComputedTotal: "50.2",
              actualComputedTotal: "25.1",
            }),
            expect.objectContaining({
              categoryId: categories[0].id,
              lineName: "Historical Infant Cohort",
              monthlyAmount: "250",
              estimatedChildOccupancyRate: "0.5",
              actualChildOccupancyRate: "0.1",
              estimatedComputedTotal: "125",
              actualComputedTotal: "25",
            }),
          ],
          worksheetLines: [
            {
              ...retainedLine,
              childCareSpaceCategoryId: categories[0].id,
            },
          ],
          configuration: [
            expect.objectContaining({
              id: fundingSubmissionLine2Id,
              sectionName: "Archived Child Care Spaces",
              deletedAt: expect.anything(),
            }),
            expect.objectContaining({
              id: administrationLineId,
              deletedAt: null,
              childCareSpaceCategoryId: categories[0].id,
            }),
          ],
          legacyColumn: undefined,
          temporaryColumn: undefined,
        })
      })
    })

    test("when historical ledger references active renamed configuration, cleanup removes only Child Care Spaces configuration", async () => {
      await withLegacyChildCareSpaceSchema(async (transaction) => {
        // Arrange
        const fundingPeriodId = await createFundingPeriod(transaction, "2024-2025")
        const fiscalPeriodId = await createFiscalPeriod(transaction, fundingPeriodId)
        const centreId = await createCentre(transaction)
        const childCareSpacesLineId = await createFundingSubmissionLine(transaction, {
          lineName: "Infants",
        })
        const renamedLineId = await createFundingSubmissionLine(transaction, {
          sectionName: "General Program",
          lineName: "Historical Toddlers",
          monthlyAmount: "80.0000",
        })
        const currentCategoryHistory = await createLegacySpace(transaction, {
          centreId,
          fiscalPeriodId,
          fundingSubmissionLineId: childCareSpacesLineId,
          lineName: "Historical Infants",
          monthlyAmount: "125.5000",
          estimatedRate: "0.4000",
          actualRate: "0.2000",
        })
        const renamedCategoryHistory = await createLegacySpace(transaction, {
          centreId,
          fiscalPeriodId,
          fundingSubmissionLineId: renamedLineId,
          lineName: "Historical Toddler Cohort",
          monthlyAmount: "90.0000",
          estimatedRate: "0.5000",
          actualRate: "0.2500",
        })
        const snapshotsBefore = await findLegacyChildCareSpaces(transaction)
        await addCategoryId(transaction)

        // Act
        await backfillCategories(transaction)
        const snapshotsAfter = await findLegacyChildCareSpaces(transaction)
        await replaceLegacyReference(transaction)
        await removeLegacyConfiguration(transaction)

        // Assert
        const configuration = await findConfiguration(transaction)
        const spaces = await findSpaces(transaction)
        expect({ configuration, spaces, snapshotsBefore, snapshotsAfter }).toEqual({
          configuration: [
            expect.objectContaining({
              id: renamedLineId,
              sectionName: "General Program",
              deletedAt: null,
            }),
          ],
          spaces: expect.arrayContaining([
            expect.objectContaining({
              id: currentCategoryHistory.id,
              lineName: "Historical Infants",
              monthlyAmount: "125.5",
              estimatedComputedTotal: "50.2",
              actualComputedTotal: "25.1",
            }),
            expect.objectContaining({
              id: renamedCategoryHistory.id,
              lineName: "Historical Toddler Cohort",
              monthlyAmount: "90",
              estimatedComputedTotal: "45",
              actualComputedTotal: "22.5",
            }),
          ]),
          snapshotsBefore,
          snapshotsAfter: snapshotsBefore,
        })
      })
    })

    test("when active configuration moved to another year, retires its historical category and keeps its current category active", async () => {
      await withLegacyChildCareSpaceSchema(async (transaction) => {
        // Arrange
        const fundingPeriod1Id = await createFundingPeriod(transaction, "2024-2025")
        const fundingPeriod2Id = await createFundingPeriod(transaction, "2025-2026")
        const fiscalPeriodId = await createFiscalPeriod(transaction, fundingPeriod1Id)
        const centreId = await createCentre(transaction)
        const fundingSubmissionLineId = await createFundingSubmissionLine(transaction, {
          fiscalYear: "2025/26",
          lineName: "Infants",
          monthlyAmount: "300.0000",
        })
        const childCareSpace = await createLegacySpace(transaction, {
          centreId,
          fiscalPeriodId,
          fundingSubmissionLineId,
          lineName: "Historical Infants",
          monthlyAmount: "100.0000",
          estimatedRate: "0.5000",
          actualRate: "0.2500",
        })
        await addCategoryId(transaction)

        // Act
        await backfillCategories(transaction)
        await replaceLegacyReference(transaction)
        await removeLegacyConfiguration(transaction)

        // Assert
        const historicalSpaceRow = await transaction("child_care_spaces")
          .select(
            { categoryId: "category_id" },
            { lineName: "line_name" },
            { monthlyAmount: "monthly_amount" },
            { estimatedComputedTotal: "estimated_computed_total" },
            { actualComputedTotal: "actual_computed_total" }
          )
          .where({ id: childCareSpace.id })
          .first()
        const historicalSpace =
          historicalSpaceRow === undefined
            ? undefined
            : {
                ...historicalSpaceRow,
                monthlyAmount: Big(historicalSpaceRow.monthlyAmount).toString(),
                estimatedComputedTotal: Big(historicalSpaceRow.estimatedComputedTotal).toString(),
                actualComputedTotal: Big(historicalSpaceRow.actualComputedTotal).toString(),
              }
        const categories = await findCategories(transaction)
        expect({ categories, historicalSpace }).toEqual({
          categories: [
            expect.objectContaining({
              fundingPeriodId: fundingPeriod1Id,
              categoryName: "Infants",
              monthlyAmount: "300",
              deletedAt: expect.anything(),
            }),
            expect.objectContaining({
              fundingPeriodId: fundingPeriod2Id,
              categoryName: "Infants",
              monthlyAmount: "300",
              deletedAt: null,
            }),
          ],
          historicalSpace: expect.objectContaining({
            categoryId: categories[0].id,
            lineName: "Historical Infants",
            monthlyAmount: "100",
            estimatedComputedTotal: "50",
            actualComputedTotal: "25",
          }),
        })
      })
    })

    test("when a ledger category conflicts with its legacy reference, rolls back all category inserts and reference updates", async () => {
      await withLegacyChildCareSpaceSchema(async (transaction) => {
        // Arrange
        const fundingPeriodId = await createFundingPeriod(transaction, "2024-2025")
        const fiscalPeriodId = await createFiscalPeriod(transaction, fundingPeriodId)
        const centreId = await createCentre(transaction)
        const fundingSubmissionLine1Id = await createFundingSubmissionLine(transaction, {
          lineName: "Infants",
        })
        const fundingSubmissionLine2Id = await createFundingSubmissionLine(transaction, {
          lineName: "Toddlers",
        })
        const childCareSpace1 = await createLegacySpace(transaction, {
          centreId,
          fiscalPeriodId,
          fundingSubmissionLineId: fundingSubmissionLine1Id,
          lineName: "Infants",
          monthlyAmount: "100.0000",
          estimatedRate: "0.5000",
          actualRate: "0.2500",
        })
        const childCareSpace2 = await createLegacySpace(transaction, {
          centreId,
          fiscalPeriodId,
          fundingSubmissionLineId: fundingSubmissionLine2Id,
          lineName: "Toddlers",
          monthlyAmount: "100.0000",
          estimatedRate: "0.5000",
          actualRate: "0.2500",
        })
        await addCategoryId(transaction)
        const wrongCategoryId = await insertRow(transaction, "child_care_space_categories", {
          funding_period_id: fundingPeriodId,
          category_name: "Unrelated Category",
          from_age: null,
          to_age: null,
          monthly_amount: "5.0000",
        })
        await transaction("child_care_spaces")
          .where({ id: childCareSpace2.id })
          .update({ category_id: wrongCategoryId })

        // Act
        // marlens-test-alignment: allow-multiple-expects -- failure and complete rollback are independent observable contracts.
        await expect(
          transaction.transaction((nestedTransaction) => backfillCategories(nestedTransaction))
        ).rejects.toThrow(
          `Unable to resolve the category for Child Care Space ${childCareSpace2.id}.`
        )

        // Assert
        const categories = await findCategories(transaction)
        const references = await findSpaces(transaction)
        expect({ categories, references }).toEqual({
          categories: [
            expect.objectContaining({ id: wrongCategoryId, categoryName: "Unrelated Category" }),
          ],
          references: [
            expect.objectContaining({ id: childCareSpace1.id, categoryId: null }),
            expect.objectContaining({ id: childCareSpace2.id, categoryId: wrongCategoryId }),
          ],
        })
      })
    })
  })
})
