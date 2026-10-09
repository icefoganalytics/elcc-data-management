import { TransactionNestMode } from "@sequelize/core"

import db from "@/models"
import type Centre from "@/models/centre"
import type FundingSubmissionLine from "@/models/funding-submission-line"
import { FiscalPeriodMonths } from "@/models/fiscal-period"
import { FundingSubmissionLineJsonMonths } from "@/models/funding-submission-line-json"
import { up as migrateChildCareSpaces } from "@/db/migrations/2026.10.07T17.43.15.migrate-child-care-spaces-from-worksheet-json"
import { type Migration } from "@/db/umzug"
import {
  centreFactory,
  fiscalPeriodFactory,
  fundingPeriodFactory,
  fundingSubmissionLineFactory,
  fundingSubmissionLineJsonFactory,
} from "@/factories"
import {
  createLegacyChildCareSpace,
  findLegacyChildCareSpaces,
  withLegacyChildCareSpaceSchema,
} from "@/db/migrations/legacy-child-care-spaces"

const FISCAL_YEAR = "2024-2025"
const FISCAL_YEAR_LEGACY = "2024/25"

const migration = { context: db.queryInterface } as Migration

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

async function createAprilFiscalPeriod() {
  const fundingPeriod = await fundingPeriodFactory.create({
    fiscalYear: FISCAL_YEAR,
  })

  return fiscalPeriodFactory.associations({ fundingPeriod }).create({
    fiscalYear: "2024-25",
    month: FiscalPeriodMonths.APRIL,
    dateStart: new Date("2024-04-01T00:00:00Z"),
    dateEnd: new Date("2024-04-30T23:59:59Z"),
  })
}

async function createHistoricalWorksheet(
  centre: Centre,
  lines: Record<string, unknown>[],
  fiscalYear = FISCAL_YEAR_LEGACY
) {
  const worksheet = fundingSubmissionLineJsonFactory.associations({ centre }).build({
    fiscalYear,
    dateName: FundingSubmissionLineJsonMonths.APRIL,
    dateStart: new Date("2024-04-01T00:00:00Z"),
    dateEnd: new Date("2024-04-30T23:59:59Z"),
    values: JSON.stringify(lines),
  })

  await worksheet.save({ validate: false })
  return worksheet
}

describe("api/src/db/migrations/2026.10.07T17.43.15.migrate-child-care-spaces-from-worksheet-json.ts", () => {
  describe("#up", () => {
    test("when historical snapshots reference changed and deleted configuration, migrates represented values idempotently", async () => {
      await withLegacyChildCareSpaceSchema(async () => {
        // Arrange
        const centre = await centreFactory.create()
        const fiscalPeriod = await createAprilFiscalPeriod()
        const newFundingSubmissionLine = await fundingSubmissionLineFactory.create({
          fiscalYear: FISCAL_YEAR_LEGACY,
          sectionName: "Child Care Spaces",
          lineName: "Infants",
          monthlyAmount: "100.0000",
        })
        const existingFundingSubmissionLine = await fundingSubmissionLineFactory.create({
          fiscalYear: FISCAL_YEAR_LEGACY,
          sectionName: "Child Care Spaces",
          lineName: "Toddlers",
          monthlyAmount: "80.0000",
        })

        const newChildCareSpaceLine = {
          submissionLineId: newFundingSubmissionLine.id,
          sectionName: "Child Care Spaces",
          lineName: "Historical Infant Cohort",
          monthlyAmount: "125.5000",
          estimatedChildOccupancyRate: "0.4000",
          actualChildOccupancyRate: "0.2000",
          estimatedComputedTotal: "50.2000",
        }
        const existingChildCareSpaceLine = {
          submissionLineId: existingFundingSubmissionLine.id,
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
        const worksheet = await createHistoricalWorksheet(centre, originalWorksheetLines)

        const existingChildCareSpace = await createLegacyChildCareSpace({
          centreId: centre.id,
          fiscalPeriodId: fiscalPeriod.id,
          fundingSubmissionLineId: existingFundingSubmissionLine.id,
          lineName: existingChildCareSpaceLine.lineName,
          monthlyAmount: existingChildCareSpaceLine.monthlyAmount,
          estimatedChildOccupancyRate: existingChildCareSpaceLine.estimatedChildOccupancyRate,
          actualChildOccupancyRate: existingChildCareSpaceLine.actualChildOccupancyRate,
        })

        await newFundingSubmissionLine.update({
          fiscalYear: "2025/26",
          sectionName: "Archived Child Care Spaces",
        })
        await existingFundingSubmissionLine.update({
          fiscalYear: "2025/26",
          sectionName: "Archived Child Care Spaces",
        })
        await newFundingSubmissionLine.destroy()
        await existingFundingSubmissionLine.destroy()

        // Act

        await db.transaction({ nestMode: TransactionNestMode.savepoint }, () =>
          migrateChildCareSpaces(migration)
        )
        await db.transaction({ nestMode: TransactionNestMode.savepoint }, () =>
          migrateChildCareSpaces(migration)
        )

        // Assert
        await worksheet.reload()
        await newFundingSubmissionLine.reload({ paranoid: false })
        await existingFundingSubmissionLine.reload({ paranoid: false })
        const migratedChildCareSpaces = await findLegacyChildCareSpaces()

        expect({
          worksheetLines: worksheet.lines,
          childCareSpaces: migratedChildCareSpaces,
        }).toEqual({
          worksheetLines: [administrationLine, otherRetainedLine],
          childCareSpaces: [
            expect.objectContaining({
              fundingSubmissionLineId: newFundingSubmissionLine.id,
              lineName: "Historical Infant Cohort",
              monthlyAmount: "125.5",
              estimatedChildOccupancyRate: "0.4",
              actualChildOccupancyRate: "0.2",
              estimatedComputedTotal: "50.2",
              actualComputedTotal: "25.1",
            }),
            expect.objectContaining({
              id: existingChildCareSpace.id,
              fundingSubmissionLineId: existingFundingSubmissionLine.id,
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
        await withLegacyChildCareSpaceSchema(async () => {
          // Arrange
          const earlierCentre = await centreFactory.create()
          const laterCentre = await centreFactory.create()
          const fiscalPeriod = await createAprilFiscalPeriod()
          const earlierFundingSubmissionLine = await fundingSubmissionLineFactory.create({
            fiscalYear: FISCAL_YEAR_LEGACY,
            sectionName: "Child Care Spaces",
            lineName: "Infants",
            monthlyAmount: "100.0000",
          })
          const earlierChildCareSpaceLine = {
            submissionLineId: earlierFundingSubmissionLine.id,
            sectionName: "Child Care Spaces",
            lineName: "Infants",
            monthlyAmount: "100.0000",
            estimatedChildOccupancyRate: "0.5000",
            actualChildOccupancyRate: "0.2500",
            estimatedComputedTotal: "50.0000",
            actualComputedTotal: "25.0000",
          }
          const earlierWorksheetLines = [earlierChildCareSpaceLine]
          const earlierWorksheet = await createHistoricalWorksheet(
            earlierCentre,
            earlierWorksheetLines
          )

          const laterFiscalYear =
            kind === "unresolved-fiscal-period" ? "2023/24" : FISCAL_YEAR_LEGACY
          let laterFundingSubmissionLineId = 999_999_999
          let laterFundingSubmissionLine: FundingSubmissionLine | undefined
          if (kind !== "unresolved-funding-submission-line") {
            laterFundingSubmissionLine = await fundingSubmissionLineFactory.create({
              fiscalYear: laterFiscalYear,
              sectionName: "Child Care Spaces",
              lineName: "Toddlers",
              monthlyAmount: "100.0000",
            })
            laterFundingSubmissionLineId = laterFundingSubmissionLine.id
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
          let laterWorksheetLines: Record<string, unknown>[] = [laterChildCareSpaceLine]

          if (kind === "conflict") {
            if (laterFundingSubmissionLine === undefined) {
              throw new Error("The conflict scenario requires a persisted funding submission line.")
            }

            await createLegacyChildCareSpace({
              centreId: laterCentre.id,
              fiscalPeriodId: fiscalPeriod.id,
              fundingSubmissionLineId: laterFundingSubmissionLine.id,
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
              {
                ...laterChildCareSpaceLine,
                estimatedComputedTotal: "49.0000",
              },
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
            laterWorksheetLines = [
              {
                ...laterChildCareSpaceLine,
                monthlyAmount: "100.00001",
              },
            ]
          }

          const laterWorksheet = await createHistoricalWorksheet(
            laterCentre,
            laterWorksheetLines,
            laterFiscalYear
          )

          // Act
          // marlens-test-alignment: allow-multiple-expects -- failure and complete rollback are independent observable contracts.
          await expect(
            db.transaction({ nestMode: TransactionNestMode.savepoint }, () =>
              migrateChildCareSpaces(migration)
            )
          ).rejects.toThrow(`worksheet ${laterWorksheet.id}`)

          // Assert
          await earlierWorksheet.reload()
          await laterWorksheet.reload()

          const childCareSpaces = await findLegacyChildCareSpaces()
          const expectedChildCareSpaces =
            kind === "conflict"
              ? [
                  expect.objectContaining({
                    centreId: laterCentre.id,
                    fiscalPeriodId: fiscalPeriod.id,
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
            earlierWorksheetLines: earlierWorksheet.lines,
            laterWorksheetLines: laterWorksheet.lines,
            childCareSpaces,
          }).toEqual({
            earlierWorksheetLines,
            laterWorksheetLines,
            childCareSpaces: expectedChildCareSpaces,
          })
        })
      }
    )
  })
})
