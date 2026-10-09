import type { Knex } from "knex"

import { up as migrateChildCareSpaces } from "@/db/migrations/20261007174315_migrate-child-care-spaces-from-worksheet-json"
import {
  createLegacyChildCareSpace,
  findLegacyChildCareSpaces,
  withLegacyChildCareSpaceSchema,
} from "@/db/migrations/legacy-child-care-spaces"

const FISCAL_YEAR = "2024-2025"

const FISCAL_YEAR_LEGACY = "2024/25"
const APRIL_START = new Date("2024-04-01T00:00:00Z")
const APRIL_END = new Date("2024-04-30T23:59:59Z")

const migrationFailureCases = [
  { description: "conflicting ledger values", kind: "conflict" },
  { description: "an unresolved fiscal period", kind: "unresolved-fiscal-period" },
  {
    description: "an unresolved funding submission line",
    kind: "unresolved-funding-submission-line",
  },
  { description: "duplicate source lines", kind: "duplicate-source-lines" },
  { description: "a malformed source line", kind: "malformed-source-line" },
  { description: "inconsistent historical totals", kind: "inconsistent-totals" },
  { description: "lossy occupancy-rate precision", kind: "lossy-occupancy-precision" },
  { description: "lossy monthly-amount precision", kind: "lossy-monthly-amount-precision" },
] as const

type IdRow = { id: number }
type HistoricalWorksheetLine = Record<string, unknown>

async function insertRow(
  transaction: Knex.Transaction,
  tableName: string,
  attributes: Record<string, unknown>
): Promise<number> {
  const [row] = await transaction(tableName).insert(attributes).returning<IdRow[]>("id")
  if (row === undefined) throw new Error(`Unable to insert fixture row into ${tableName}.`)

  return row.id
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

async function createFundingPeriod(transaction: Knex.Transaction): Promise<number> {
  return insertRow(transaction, "funding_periods", {
    fiscal_year: FISCAL_YEAR,
    from_date: new Date("2024-04-01T00:00:00Z"),
    to_date: new Date("2025-03-31T23:59:59Z"),
    title: "Migration Fixture Funding Period",
  })
}

async function createAprilFiscalPeriod(transaction: Knex.Transaction): Promise<number> {
  const fundingPeriodId = await createFundingPeriod(transaction)
  return insertRow(transaction, "fiscal_periods", {
    funding_period_id: fundingPeriodId,
    fiscal_year: "2024-25",
    month: "April",
    date_start: APRIL_START,
    date_end: APRIL_END,
  })
}

async function createFundingSubmissionLine(
  transaction: Knex.Transaction,
  attributes: {
    fiscalYear?: string
    sectionName?: string
    lineName?: string
    monthlyAmount?: string
  } = {}
): Promise<number> {
  return insertRow(transaction, "funding_submission_lines", {
    fiscal_year: attributes.fiscalYear ?? FISCAL_YEAR_LEGACY,
    section_name: attributes.sectionName ?? "Child Care Spaces",
    line_name: attributes.lineName ?? "Infants",
    monthly_amount: attributes.monthlyAmount ?? "100.0000",
  })
}

async function createHistoricalWorksheet(
  transaction: Knex.Transaction,
  centreId: number,
  lines: HistoricalWorksheetLine[],
  fiscalYear = FISCAL_YEAR_LEGACY
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

async function findWorksheetLines(transaction: Knex.Transaction, worksheetId: number) {
  const worksheet = await transaction("funding_submission_line_jsons")
    .select("values")
    .where({ id: worksheetId })
    .first()
  if (worksheet === undefined) throw new Error(`Worksheet ${worksheetId} was not found.`)
  return JSON.parse(worksheet.values) as HistoricalWorksheetLine[]
}

describe("api/src/db/migrations/20261007174315_migrate-child-care-spaces-from-worksheet-json.ts", () => {
  describe("#up", () => {
    test("when historical snapshots reference changed and deleted configuration, migrates represented values idempotently", async () => {
      await withLegacyChildCareSpaceSchema(async (transaction) => {
        // Arrange
        const centreId = await createCentre(transaction)
        const fiscalPeriodId = await createAprilFiscalPeriod(transaction)
        const newFundingSubmissionLineId = await createFundingSubmissionLine(transaction, {
          lineName: "Infants",
        })
        const existingFundingSubmissionLineId = await createFundingSubmissionLine(transaction, {
          lineName: "Toddlers",
          monthlyAmount: "80.0000",
        })

        const newChildCareSpaceLine = {
          submissionLineId: newFundingSubmissionLineId,
          sectionName: "Child Care Spaces",
          lineName: "Historical Infant Cohort",
          monthlyAmount: "125.5000",
          estimatedChildOccupancyRate: "0.4000",
          actualChildOccupancyRate: "0.2000",
          estimatedComputedTotal: "50.2000",
        }
        const existingChildCareSpaceLine = {
          submissionLineId: existingFundingSubmissionLineId,
          sectionName: "Child Care Spaces",
          lineName: "Historical Toddler Cohort",
          monthlyAmount: "80.0000",
          estimatedChildOccupancyRate: "0.2500",
          actualChildOccupancyRate: "0.1250",
          estimatedComputedTotal: "20.00000",
          actualComputedTotal: "10.0000",
        }
        const administrationLine = {
          submissionLineId: 901,
          sectionName: "Administration (10% of Spaces)",
          lineName: "Infants",
          monthlyAmount: "12.5500",
          estimatedChildOccupancyRate: "0.4000",
          actualChildOccupancyRate: "0.2000",
          estimatedComputedTotal: "5.0200",
          actualComputedTotal: "2.5100",
        }
        const otherRetainedLine = {
          sectionName: "Quality Program Enhancement",
          lineName: "Learning materials",
          monthlyAmount: "7.2500",
          historicalNote: "retained without transformation",
        }
        const originalWorksheetLines = [
          newChildCareSpaceLine,
          administrationLine,
          existingChildCareSpaceLine,
          otherRetainedLine,
        ]
        const worksheetId = await createHistoricalWorksheet(
          transaction,
          centreId,
          originalWorksheetLines
        )

        const existingChildCareSpace = await createLegacyChildCareSpace(transaction, {
          centreId,
          fiscalPeriodId,
          fundingSubmissionLineId: existingFundingSubmissionLineId,
          lineName: existingChildCareSpaceLine.lineName,
          monthlyAmount: existingChildCareSpaceLine.monthlyAmount,
          estimatedChildOccupancyRate: existingChildCareSpaceLine.estimatedChildOccupancyRate,
          actualChildOccupancyRate: existingChildCareSpaceLine.actualChildOccupancyRate,
        })

        await transaction("funding_submission_lines")
          .whereIn("id", [newFundingSubmissionLineId, existingFundingSubmissionLineId])
          .update({ fiscal_year: "2025/26", section_name: "Archived Child Care Spaces" })
        await transaction("funding_submission_lines")
          .whereIn("id", [newFundingSubmissionLineId, existingFundingSubmissionLineId])
          .update({ deleted_at: new Date("2026-10-09T00:00:00Z") })

        // Act
        await migrateChildCareSpaces(transaction)
        await migrateChildCareSpaces(transaction)

        // Assert
        const worksheetLines = await findWorksheetLines(transaction, worksheetId)
        const migratedChildCareSpaces = await findLegacyChildCareSpaces(transaction)
        expect({ worksheetLines, childCareSpaces: migratedChildCareSpaces }).toEqual({
          worksheetLines: [administrationLine, otherRetainedLine],
          childCareSpaces: [
            expect.objectContaining({
              fundingSubmissionLineId: newFundingSubmissionLineId,
              lineName: "Historical Infant Cohort",
              monthlyAmount: "125.5",
              estimatedChildOccupancyRate: "0.4",
              actualChildOccupancyRate: "0.2",
              estimatedComputedTotal: "50.2",
              actualComputedTotal: "25.1",
            }),
            expect.objectContaining({
              id: existingChildCareSpace.id,
              fundingSubmissionLineId: existingFundingSubmissionLineId,
              lineName: "Historical Toddler Cohort",
              monthlyAmount: "80",
              estimatedChildOccupancyRate: "0.25",
              actualChildOccupancyRate: "0.125",
              estimatedComputedTotal: "20",
              actualComputedTotal: "10",
            }),
          ],
        })
      })
    })

    test.each(migrationFailureCases)(
      "when a later worksheet has $description, rolls back earlier worksheet migration",
      async ({ kind }) => {
        await withLegacyChildCareSpaceSchema(async (transaction) => {
          // Arrange
          const earlierCentreId = await createCentre(transaction)
          const laterCentreId = await createCentre(transaction)
          const fiscalPeriodId = await createAprilFiscalPeriod(transaction)
          const earlierFundingSubmissionLineId = await createFundingSubmissionLine(transaction)
          const earlierChildCareSpaceLine = {
            submissionLineId: earlierFundingSubmissionLineId,
            sectionName: "Child Care Spaces",
            lineName: "Infants",
            monthlyAmount: "100.0000",
            estimatedChildOccupancyRate: "0.5000",
            actualChildOccupancyRate: "0.2500",
            estimatedComputedTotal: "50.0000",
            actualComputedTotal: "25.0000",
          }
          const earlierWorksheetLines = [earlierChildCareSpaceLine]
          const earlierWorksheetId = await createHistoricalWorksheet(
            transaction,
            earlierCentreId,
            earlierWorksheetLines
          )

          const laterFiscalYear =
            kind === "unresolved-fiscal-period" ? "2023/24" : FISCAL_YEAR_LEGACY
          let laterFundingSubmissionLineId = 999_999_999
          if (kind !== "unresolved-funding-submission-line") {
            laterFundingSubmissionLineId = await createFundingSubmissionLine(transaction, {
              fiscalYear: laterFiscalYear,
              lineName: "Toddlers",
            })
          }

          const laterChildCareSpaceLine = {
            submissionLineId: laterFundingSubmissionLineId,
            sectionName: "Child Care Spaces",
            lineName: "Toddlers",
            monthlyAmount: "100.0000",
            estimatedChildOccupancyRate: "0.5000",
            actualChildOccupancyRate: "0.2500",
            estimatedComputedTotal: "50.0000",
            actualComputedTotal: "25.0000",
          }
          let laterWorksheetLines: HistoricalWorksheetLine[] = [laterChildCareSpaceLine]

          if (kind === "conflict") {
            await createLegacyChildCareSpace(transaction, {
              centreId: laterCentreId,
              fiscalPeriodId,
              fundingSubmissionLineId: laterFundingSubmissionLineId,
              lineName: laterChildCareSpaceLine.lineName,
              monthlyAmount: "100.0000",
              estimatedChildOccupancyRate: "0.7500",
              actualChildOccupancyRate: "0.2500",
            })
          } else if (kind === "duplicate-source-lines") {
            laterWorksheetLines = [laterChildCareSpaceLine, laterChildCareSpaceLine]
          } else if (kind === "malformed-source-line") {
            const malformedChildCareSpaceLine: Record<string, unknown> = {
              ...laterChildCareSpaceLine,
            }
            delete malformedChildCareSpaceLine.monthlyAmount
            laterWorksheetLines = [malformedChildCareSpaceLine]
          } else if (kind === "inconsistent-totals") {
            laterWorksheetLines = [
              { ...laterChildCareSpaceLine, estimatedComputedTotal: "49.0000" },
            ]
          } else if (kind === "lossy-occupancy-precision") {
            laterWorksheetLines = [
              {
                ...laterChildCareSpaceLine,
                estimatedChildOccupancyRate: "0.12345",
                estimatedComputedTotal: "12.3450",
              },
            ]
          } else if (kind === "lossy-monthly-amount-precision") {
            laterWorksheetLines = [{ ...laterChildCareSpaceLine, monthlyAmount: "100.00001" }]
          }

          const laterWorksheetId = await createHistoricalWorksheet(
            transaction,
            laterCentreId,
            laterWorksheetLines,
            laterFiscalYear
          )

          // Act
          // marlens-test-alignment: allow-multiple-expects -- failure and complete rollback are independent observable contracts.
          await expect(
            transaction.transaction((nestedTransaction) =>
              migrateChildCareSpaces(nestedTransaction)
            )
          ).rejects.toThrow(`worksheet ${laterWorksheetId}`)

          // Assert
          const remainedEarlierWorksheetLines = await findWorksheetLines(
            transaction,
            earlierWorksheetId
          )
          const remainedLaterWorksheetLines = await findWorksheetLines(
            transaction,
            laterWorksheetId
          )
          const childCareSpaces = await findLegacyChildCareSpaces(transaction)
          const expectedChildCareSpaces =
            kind === "conflict"
              ? [
                  expect.objectContaining({
                    centreId: laterCentreId,
                    fiscalPeriodId,
                    fundingSubmissionLineId: laterFundingSubmissionLineId,
                    monthlyAmount: "100",
                    estimatedChildOccupancyRate: "0.75",
                    actualChildOccupancyRate: "0.25",
                    estimatedComputedTotal: "75",
                    actualComputedTotal: "25",
                  }),
                ]
              : []
          expect({
            earlierWorksheetLines: remainedEarlierWorksheetLines,
            laterWorksheetLines: remainedLaterWorksheetLines,
            childCareSpaces,
          }).toEqual({
            earlierWorksheetLines: [earlierChildCareSpaceLine],
            laterWorksheetLines,
            childCareSpaces: expectedChildCareSpaces,
          })
        })
      }
    )
  })
})
