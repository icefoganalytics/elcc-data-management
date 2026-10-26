import {
  APRIL_END,
  APRIL_START,
  LEGACY_FISCAL_YEAR,
  administrationValue,
  createAprilFiscalPeriod,
  createCentre,
  createFundingPeriod,
  createFundingSubmissionLine,
  createWorksheet,
  insertRow,
  withLegacyAdministrationSchema,
} from "@/db/migrations/legacy-administration-costs"

import { up as migrateAdministrationCosts } from "@/db/migrations/20261020180002_migrate-administration-costs-from-worksheet-json"

describe("api/src/db/migrations/20261020180002_migrate-administration-costs-from-worksheet-json.ts", () => {
  describe("#up: unusable legacy data", () => {
    test("when active snapshots duplicate a ledger key, keeps the first valid snapshot and retires both JSON rows", async () => {
      await withLegacyAdministrationSchema(async (transaction) => {
        // Arrange
        const centreId = await createCentre(transaction)
        const fundingPeriodId = await createFundingPeriod(transaction)
        const fiscalPeriodId = await createAprilFiscalPeriod(transaction, fundingPeriodId)
        const sourceLineId = await createFundingSubmissionLine(transaction)
        const firstWorksheetId = await createWorksheet(
          transaction,
          centreId,
          JSON.stringify([administrationValue(sourceLineId)])
        )
        const duplicateWorksheetId = await createWorksheet(
          transaction,
          centreId,
          JSON.stringify([
            administrationValue(sourceLineId, {
              monthlyAmount: "99.0000",
              estimatedComputedTotal: "39.6000",
              actualComputedTotal: "19.8000",
            }),
          ])
        )

        // Act
        await migrateAdministrationCosts(transaction)

        // Assert
        const administrationCosts = await transaction("administration_costs").select(
          "centre_id",
          "fiscal_period_id",
          "child_care_space_category_id",
          "line_name",
          transaction.raw("CONVERT(VARCHAR(32), monthly_amount) AS monthlyAmount"),
          transaction.raw("CONVERT(VARCHAR(32), estimated_child_occupancy_rate) AS estimatedRate"),
          transaction.raw("CONVERT(VARCHAR(32), actual_child_occupancy_rate) AS actualRate"),
          transaction.raw("CONVERT(VARCHAR(32), estimated_computed_total) AS estimatedTotal"),
          transaction.raw("CONVERT(VARCHAR(32), actual_computed_total) AS actualTotal")
        )
        expect(administrationCosts).toEqual([
          {
            centre_id: centreId,
            fiscal_period_id: fiscalPeriodId,
            child_care_space_category_id: null,
            line_name: "Infants",
            monthlyAmount: "12.5500",
            estimatedRate: "0.4000",
            actualRate: "0.2000",
            estimatedTotal: "5.0200",
            actualTotal: "2.5100",
          },
        ])

        const worksheetRows = await transaction("funding_submission_line_jsons")
          .select("id", "values")
          .whereIn("id", [firstWorksheetId, duplicateWorksheetId])
        expect(worksheetRows).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: firstWorksheetId,
              values: "[]",
            }),
            expect.objectContaining({
              id: duplicateWorksheetId,
              values: "[]",
            }),
          ])
        )
        expect(worksheetRows).toHaveLength(2)
      })
    })

    test("when another section references an Administration source, preserves its raw row while migrating and retiring Administration data", async () => {
      await withLegacyAdministrationSchema(async (transaction) => {
        // Arrange
        const centreId = await createCentre(transaction)
        const fundingPeriodId = await createFundingPeriod(transaction)
        const fiscalPeriodId = await createAprilFiscalPeriod(transaction, fundingPeriodId)
        const sourceLineId = await createFundingSubmissionLine(transaction)
        const otherSourceId = await createFundingSubmissionLine(transaction, {
          sectionName: "Quality Enhancement Program",
        })
        const otherSectionJson =
          `{"sectionName":"Quality Enhancement Program","submissionLineId":${sourceLineId},` +
          '"monthlyAmount":1.2300,"originalNumber":9007199254740993,"unknown":{"kept":true}}'
        const worksheetValues = `[${JSON.stringify(administrationValue(sourceLineId))},${otherSectionJson}]`
        const worksheetId = await createWorksheet(transaction, centreId, worksheetValues)

        // Act
        await migrateAdministrationCosts(transaction)

        // Assert
        const administrationCosts = await transaction("administration_costs").select(
          "centre_id",
          "fiscal_period_id",
          "child_care_space_category_id",
          "line_name",
          transaction.raw("CONVERT(VARCHAR(32), monthly_amount) AS monthlyAmount"),
          transaction.raw("CONVERT(VARCHAR(32), estimated_child_occupancy_rate) AS estimatedRate"),
          transaction.raw("CONVERT(VARCHAR(32), actual_child_occupancy_rate) AS actualRate"),
          transaction.raw("CONVERT(VARCHAR(32), estimated_computed_total) AS estimatedTotal"),
          transaction.raw("CONVERT(VARCHAR(32), actual_computed_total) AS actualTotal")
        )
        expect(administrationCosts).toEqual([
          {
            centre_id: centreId,
            fiscal_period_id: fiscalPeriodId,
            child_care_space_category_id: null,
            line_name: "Infants",
            monthlyAmount: "12.5500",
            estimatedRate: "0.4000",
            actualRate: "0.2000",
            estimatedTotal: "5.0200",
            actualTotal: "2.5100",
          },
        ])

        const worksheet = await transaction("funding_submission_line_jsons")
          .select("values")
          .where({
            id: worksheetId,
          })
          .first()
        expect(worksheet?.values).toEqual(`[${otherSectionJson}]`)

        const remainingSources = await transaction("funding_submission_lines").select(
          "id",
          "section_name"
        )
        expect(remainingSources).toEqual([
          {
            id: otherSourceId,
            section_name: "Quality Enhancement Program",
          },
        ])
      })
    })

    test("when an Administration row references no source line, discards it and migrates valid neighboring data", async () => {
      await withLegacyAdministrationSchema(async (transaction) => {
        // Arrange
        const centreId = await createCentre(transaction)
        const fundingPeriodId = await createFundingPeriod(transaction)
        const fiscalPeriodId = await createAprilFiscalPeriod(transaction, fundingPeriodId)
        const sourceLineId = await createFundingSubmissionLine(transaction)
        const worksheetId = await createWorksheet(
          transaction,
          centreId,
          JSON.stringify([administrationValue(999_999_999), administrationValue(sourceLineId)])
        )

        // Act
        await migrateAdministrationCosts(transaction)

        // Assert
        const administrationCosts = await transaction("administration_costs").select(
          "centre_id",
          "fiscal_period_id",
          "child_care_space_category_id",
          "line_name",
          transaction.raw("CONVERT(VARCHAR(32), monthly_amount) AS monthlyAmount"),
          transaction.raw("CONVERT(VARCHAR(32), estimated_child_occupancy_rate) AS estimatedRate"),
          transaction.raw("CONVERT(VARCHAR(32), actual_child_occupancy_rate) AS actualRate"),
          transaction.raw("CONVERT(VARCHAR(32), estimated_computed_total) AS estimatedTotal"),
          transaction.raw("CONVERT(VARCHAR(32), actual_computed_total) AS actualTotal")
        )
        expect(administrationCosts).toEqual([
          {
            centre_id: centreId,
            fiscal_period_id: fiscalPeriodId,
            child_care_space_category_id: null,
            line_name: "Infants",
            monthlyAmount: "12.5500",
            estimatedRate: "0.4000",
            actualRate: "0.2000",
            estimatedTotal: "5.0200",
            actualTotal: "2.5100",
          },
        ])

        const worksheet = await transaction("funding_submission_line_jsons")
          .select("values")
          .where({
            id: worksheetId,
          })
          .first()
        expect(worksheet?.values).toEqual("[]")
      })
    })

    test("when an Administration row has no matching fiscal month, discards it and migrates valid neighboring data", async () => {
      await withLegacyAdministrationSchema(async (transaction) => {
        // Arrange
        const centreId = await createCentre(transaction)
        const fundingPeriodId = await createFundingPeriod(transaction)
        const fiscalPeriodId = await createAprilFiscalPeriod(transaction, fundingPeriodId)
        const sourceLineId = await createFundingSubmissionLine(transaction)
        const validWorksheetId = await createWorksheet(
          transaction,
          centreId,
          JSON.stringify([administrationValue(sourceLineId)])
        )
        const missingMonthWorksheetId = await createWorksheet(
          transaction,
          centreId,
          JSON.stringify([administrationValue(sourceLineId)]),
          LEGACY_FISCAL_YEAR,
          "May"
        )

        // Act
        await migrateAdministrationCosts(transaction)

        // Assert
        const administrationCosts = await transaction("administration_costs").select(
          "centre_id",
          "fiscal_period_id",
          "child_care_space_category_id",
          "line_name",
          transaction.raw("CONVERT(VARCHAR(32), monthly_amount) AS monthlyAmount"),
          transaction.raw("CONVERT(VARCHAR(32), estimated_child_occupancy_rate) AS estimatedRate"),
          transaction.raw("CONVERT(VARCHAR(32), actual_child_occupancy_rate) AS actualRate"),
          transaction.raw("CONVERT(VARCHAR(32), estimated_computed_total) AS estimatedTotal"),
          transaction.raw("CONVERT(VARCHAR(32), actual_computed_total) AS actualTotal")
        )
        expect(administrationCosts).toEqual([
          {
            centre_id: centreId,
            fiscal_period_id: fiscalPeriodId,
            child_care_space_category_id: null,
            line_name: "Infants",
            monthlyAmount: "12.5500",
            estimatedRate: "0.4000",
            actualRate: "0.2000",
            estimatedTotal: "5.0200",
            actualTotal: "2.5100",
          },
        ])

        const worksheetRows = await transaction("funding_submission_line_jsons")
          .select("id", "values")
          .whereIn("id", [validWorksheetId, missingMonthWorksheetId])
        expect(worksheetRows).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: validWorksheetId,
              values: "[]",
            }),
            expect.objectContaining({
              id: missingMonthWorksheetId,
              values: "[]",
            }),
          ])
        )
        expect(worksheetRows).toHaveLength(2)
      })
    })

    test("when an Administration row has a numeric-string source ID, discards it and migrates valid neighboring data", async () => {
      await withLegacyAdministrationSchema(async (transaction) => {
        // Arrange
        const centreId = await createCentre(transaction)
        const fundingPeriodId = await createFundingPeriod(transaction)
        const fiscalPeriodId = await createAprilFiscalPeriod(transaction, fundingPeriodId)
        const invalidSourceLineId = await createFundingSubmissionLine(transaction, {
          lineName: "Toddlers",
        })
        const validSourceLineId = await createFundingSubmissionLine(transaction)
        const worksheetId = await createWorksheet(
          transaction,
          centreId,
          JSON.stringify([
            {
              ...administrationValue(invalidSourceLineId),
              submissionLineId: String(invalidSourceLineId),
            },
            administrationValue(validSourceLineId),
          ])
        )

        // Act
        await migrateAdministrationCosts(transaction)

        // Assert
        const administrationCosts = await transaction("administration_costs").select(
          "centre_id",
          "fiscal_period_id",
          "child_care_space_category_id",
          "line_name",
          transaction.raw("CONVERT(VARCHAR(32), monthly_amount) AS monthlyAmount"),
          transaction.raw("CONVERT(VARCHAR(32), estimated_child_occupancy_rate) AS estimatedRate"),
          transaction.raw("CONVERT(VARCHAR(32), actual_child_occupancy_rate) AS actualRate"),
          transaction.raw("CONVERT(VARCHAR(32), estimated_computed_total) AS estimatedTotal"),
          transaction.raw("CONVERT(VARCHAR(32), actual_computed_total) AS actualTotal")
        )
        expect(administrationCosts).toEqual([
          {
            centre_id: centreId,
            fiscal_period_id: fiscalPeriodId,
            child_care_space_category_id: null,
            line_name: "Infants",
            monthlyAmount: "12.5500",
            estimatedRate: "0.4000",
            actualRate: "0.2000",
            estimatedTotal: "5.0200",
            actualTotal: "2.5100",
          },
        ])

        const worksheet = await transaction("funding_submission_line_jsons")
          .select("values")
          .where({
            id: worksheetId,
          })
          .first()
        expect(worksheet?.values).toEqual("[]")
      })
    })

    test("when an Administration row exceeds decimal precision, discards it without rounding valid neighboring data", async () => {
      await withLegacyAdministrationSchema(async (transaction) => {
        // Arrange
        const centreId = await createCentre(transaction)
        const fundingPeriodId = await createFundingPeriod(transaction)
        const fiscalPeriodId = await createAprilFiscalPeriod(transaction, fundingPeriodId)
        const sourceLineId = await createFundingSubmissionLine(transaction)
        const worksheetId = await createWorksheet(
          transaction,
          centreId,
          JSON.stringify([
            administrationValue(sourceLineId, {
              monthlyAmount: "12.34567",
              estimatedComputedTotal: "4.938268",
              actualComputedTotal: "2.469134",
            }),
            administrationValue(sourceLineId),
          ])
        )

        // Act
        await migrateAdministrationCosts(transaction)

        // Assert
        const administrationCosts = await transaction("administration_costs").select(
          "centre_id",
          "fiscal_period_id",
          "child_care_space_category_id",
          "line_name",
          transaction.raw("CONVERT(VARCHAR(32), monthly_amount) AS monthlyAmount"),
          transaction.raw("CONVERT(VARCHAR(32), estimated_child_occupancy_rate) AS estimatedRate"),
          transaction.raw("CONVERT(VARCHAR(32), actual_child_occupancy_rate) AS actualRate"),
          transaction.raw("CONVERT(VARCHAR(32), estimated_computed_total) AS estimatedTotal"),
          transaction.raw("CONVERT(VARCHAR(32), actual_computed_total) AS actualTotal")
        )
        expect(administrationCosts).toEqual([
          {
            centre_id: centreId,
            fiscal_period_id: fiscalPeriodId,
            child_care_space_category_id: null,
            line_name: "Infants",
            monthlyAmount: "12.5500",
            estimatedRate: "0.4000",
            actualRate: "0.2000",
            estimatedTotal: "5.0200",
            actualTotal: "2.5100",
          },
        ])

        const worksheet = await transaction("funding_submission_line_jsons")
          .select("values")
          .where({
            id: worksheetId,
          })
          .first()
        expect(worksheet?.values).toEqual("[]")
      })
    })

    test("when Administration rows repeat known properties or have malformed values, discards them and migrates valid neighboring data", async () => {
      await withLegacyAdministrationSchema(async (transaction) => {
        // Arrange
        const centreId = await createCentre(transaction)
        const fundingPeriodId = await createFundingPeriod(transaction)
        const fiscalPeriodId = await createAprilFiscalPeriod(transaction, fundingPeriodId)
        const invalidSourceLineId = await createFundingSubmissionLine(transaction, {
          lineName: "Toddlers",
        })
        const validSourceLineId = await createFundingSubmissionLine(transaction)
        const repeatedPropertyRow =
          `{"sectionName":"Administration","submissionLineId":${invalidSourceLineId},` +
          `"submissionLineId":${invalidSourceLineId},"lineName":"Toddlers",` +
          '"monthlyAmount":"12.5500","estimatedChildOccupancyRate":"0.4000",' +
          '"actualChildOccupancyRate":"0.2000"}'
        const malformedPropertyRow = JSON.stringify({
          sectionName: "Administration",
          submissionLineId: invalidSourceLineId,
          lineName: "Toddlers",
          monthlyAmount: {
            amount: "12.5500",
          },
        })
        const worksheetValues =
          `[${repeatedPropertyRow},${malformedPropertyRow},` +
          `${JSON.stringify(administrationValue(validSourceLineId))}]`
        const worksheetId = await createWorksheet(transaction, centreId, worksheetValues)

        // Act
        await migrateAdministrationCosts(transaction)

        // Assert
        const administrationCosts = await transaction("administration_costs").select(
          "centre_id",
          "fiscal_period_id",
          "child_care_space_category_id",
          "line_name",
          transaction.raw("CONVERT(VARCHAR(32), monthly_amount) AS monthlyAmount"),
          transaction.raw("CONVERT(VARCHAR(32), estimated_child_occupancy_rate) AS estimatedRate"),
          transaction.raw("CONVERT(VARCHAR(32), actual_child_occupancy_rate) AS actualRate"),
          transaction.raw("CONVERT(VARCHAR(32), estimated_computed_total) AS estimatedTotal"),
          transaction.raw("CONVERT(VARCHAR(32), actual_computed_total) AS actualTotal")
        )
        expect(administrationCosts).toEqual([
          {
            centre_id: centreId,
            fiscal_period_id: fiscalPeriodId,
            child_care_space_category_id: null,
            line_name: "Infants",
            monthlyAmount: "12.5500",
            estimatedRate: "0.4000",
            actualRate: "0.2000",
            estimatedTotal: "5.0200",
            actualTotal: "2.5100",
          },
        ])

        const worksheet = await transaction("funding_submission_line_jsons")
          .select("values")
          .where({
            id: worksheetId,
          })
          .first()
        expect(worksheet?.values).toEqual("[]")
      })
    })

    test("when an Administration row has an invalid optional Spaces link, preserves its money and clears the link", async () => {
      await withLegacyAdministrationSchema(async (transaction) => {
        // Arrange
        const centreId = await createCentre(transaction)
        const fundingPeriodId = await createFundingPeriod(transaction)
        const fiscalPeriodId = await createAprilFiscalPeriod(transaction, fundingPeriodId)
        const sourceLineId = await createFundingSubmissionLine(transaction)
        const worksheetId = await createWorksheet(
          transaction,
          centreId,
          JSON.stringify([
            administrationValue(sourceLineId, {
              childCareSpaceCategoryId: 999_999_999,
            }),
          ])
        )

        // Act
        await migrateAdministrationCosts(transaction)

        // Assert
        const administrationCosts = await transaction("administration_costs").select(
          "centre_id",
          "fiscal_period_id",
          "child_care_space_category_id",
          "line_name",
          transaction.raw("CONVERT(VARCHAR(32), monthly_amount) AS monthlyAmount"),
          transaction.raw("CONVERT(VARCHAR(32), estimated_child_occupancy_rate) AS estimatedRate"),
          transaction.raw("CONVERT(VARCHAR(32), actual_child_occupancy_rate) AS actualRate"),
          transaction.raw("CONVERT(VARCHAR(32), estimated_computed_total) AS estimatedTotal"),
          transaction.raw("CONVERT(VARCHAR(32), actual_computed_total) AS actualTotal")
        )
        expect(administrationCosts).toEqual([
          {
            centre_id: centreId,
            fiscal_period_id: fiscalPeriodId,
            child_care_space_category_id: null,
            line_name: "Infants",
            monthlyAmount: "12.5500",
            estimatedRate: "0.4000",
            actualRate: "0.2000",
            estimatedTotal: "5.0200",
            actualTotal: "2.5100",
          },
        ])
        const worksheet = await transaction("funding_submission_line_jsons")
          .select("values")
          .where({
            id: worksheetId,
          })
          .first()
        expect(worksheet?.values).toEqual("[]")
      })
    })

    test("when an Administration row has an invalid fiscal year, discards it and migrates valid neighboring data", async () => {
      await withLegacyAdministrationSchema(async (transaction) => {
        // Arrange
        const centreId = await createCentre(transaction)
        const fundingPeriodId = await createFundingPeriod(transaction)
        const fiscalPeriodId = await createAprilFiscalPeriod(transaction, fundingPeriodId)
        const sourceLineId = await createFundingSubmissionLine(transaction)
        const validWorksheetId = await createWorksheet(
          transaction,
          centreId,
          JSON.stringify([administrationValue(sourceLineId)])
        )
        const invalidFiscalYearWorksheetId = await createWorksheet(
          transaction,
          centreId,
          JSON.stringify([administrationValue(sourceLineId)]),
          "2147/49"
        )

        // Act
        await migrateAdministrationCosts(transaction)

        // Assert
        const administrationCosts = await transaction("administration_costs").select(
          "centre_id",
          "fiscal_period_id",
          "child_care_space_category_id",
          "line_name",
          transaction.raw("CONVERT(VARCHAR(32), monthly_amount) AS monthlyAmount"),
          transaction.raw("CONVERT(VARCHAR(32), estimated_child_occupancy_rate) AS estimatedRate"),
          transaction.raw("CONVERT(VARCHAR(32), actual_child_occupancy_rate) AS actualRate"),
          transaction.raw("CONVERT(VARCHAR(32), estimated_computed_total) AS estimatedTotal"),
          transaction.raw("CONVERT(VARCHAR(32), actual_computed_total) AS actualTotal")
        )
        expect(administrationCosts).toEqual([
          {
            centre_id: centreId,
            fiscal_period_id: fiscalPeriodId,
            child_care_space_category_id: null,
            line_name: "Infants",
            monthlyAmount: "12.5500",
            estimatedRate: "0.4000",
            actualRate: "0.2000",
            estimatedTotal: "5.0200",
            actualTotal: "2.5100",
          },
        ])

        const worksheetRows = await transaction("funding_submission_line_jsons")
          .select("id", "values")
          .whereIn("id", [validWorksheetId, invalidFiscalYearWorksheetId])
        expect(worksheetRows).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: validWorksheetId,
              values: "[]",
            }),
            expect.objectContaining({
              id: invalidFiscalYearWorksheetId,
              values: "[]",
            }),
          ])
        )
        expect(worksheetRows).toHaveLength(2)
      })
    })

    test("when an Administration row matches duplicate fiscal periods, discards it and migrates an unambiguous neighboring month", async () => {
      await withLegacyAdministrationSchema(async (transaction) => {
        // Arrange
        const centreId = await createCentre(transaction)
        const fundingPeriodId = await createFundingPeriod(transaction)
        await createAprilFiscalPeriod(transaction, fundingPeriodId)
        await insertRow(transaction, "fiscal_periods", {
          funding_period_id: fundingPeriodId,
          fiscal_year: "2147/48",
          month: "April",
          date_start: APRIL_START,
          date_end: APRIL_END,
        })
        const mayFiscalPeriodId = await insertRow(transaction, "fiscal_periods", {
          funding_period_id: fundingPeriodId,
          fiscal_year: "2147/48",
          month: "May",
          date_start: new Date("2147-05-01T00:00:00Z"),
          date_end: new Date("2147-05-31T23:59:59Z"),
        })
        const sourceLineId = await createFundingSubmissionLine(transaction)
        const ambiguousWorksheetId = await createWorksheet(
          transaction,
          centreId,
          JSON.stringify([administrationValue(sourceLineId)])
        )
        const validWorksheetId = await createWorksheet(
          transaction,
          centreId,
          JSON.stringify([administrationValue(sourceLineId)]),
          LEGACY_FISCAL_YEAR,
          "May"
        )

        // Act
        await migrateAdministrationCosts(transaction)

        // Assert
        const administrationCosts = await transaction("administration_costs").select(
          "centre_id",
          "fiscal_period_id",
          "child_care_space_category_id",
          "line_name",
          transaction.raw("CONVERT(VARCHAR(32), monthly_amount) AS monthlyAmount"),
          transaction.raw("CONVERT(VARCHAR(32), estimated_child_occupancy_rate) AS estimatedRate"),
          transaction.raw("CONVERT(VARCHAR(32), actual_child_occupancy_rate) AS actualRate"),
          transaction.raw("CONVERT(VARCHAR(32), estimated_computed_total) AS estimatedTotal"),
          transaction.raw("CONVERT(VARCHAR(32), actual_computed_total) AS actualTotal")
        )
        expect(administrationCosts).toEqual([
          {
            centre_id: centreId,
            fiscal_period_id: mayFiscalPeriodId,
            child_care_space_category_id: null,
            line_name: "Infants",
            monthlyAmount: "12.5500",
            estimatedRate: "0.4000",
            actualRate: "0.2000",
            estimatedTotal: "5.0200",
            actualTotal: "2.5100",
          },
        ])

        const worksheetRows = await transaction("funding_submission_line_jsons")
          .select("id", "values")
          .whereIn("id", [ambiguousWorksheetId, validWorksheetId])
        expect(worksheetRows).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: ambiguousWorksheetId,
              values: "[]",
            }),
            expect.objectContaining({
              id: validWorksheetId,
              values: "[]",
            }),
          ])
        )
        expect(worksheetRows).toHaveLength(2)
      })
    })

    test("when active Administration source categories duplicate a name, migrates unrelated valid categories", async () => {
      await withLegacyAdministrationSchema(async (transaction) => {
        // Arrange
        const centreId = await createCentre(transaction)
        const fundingPeriodId = await createFundingPeriod(transaction)
        const fiscalPeriodId = await createAprilFiscalPeriod(transaction, fundingPeriodId)
        await createFundingSubmissionLine(transaction, {
          lineName: "Infants",
        })
        await createFundingSubmissionLine(transaction, {
          lineName: "Infants",
        })
        const validSourceLineId = await createFundingSubmissionLine(transaction, {
          lineName: "Toddlers",
        })
        const worksheetId = await createWorksheet(
          transaction,
          centreId,
          JSON.stringify([
            administrationValue(validSourceLineId, {
              lineName: "Toddlers",
            }),
          ])
        )

        // Act
        await migrateAdministrationCosts(transaction)

        // Assert
        const administrationCosts = await transaction("administration_costs").select(
          "centre_id",
          "fiscal_period_id",
          "child_care_space_category_id",
          "line_name",
          transaction.raw("CONVERT(VARCHAR(32), monthly_amount) AS monthlyAmount"),
          transaction.raw("CONVERT(VARCHAR(32), estimated_child_occupancy_rate) AS estimatedRate"),
          transaction.raw("CONVERT(VARCHAR(32), actual_child_occupancy_rate) AS actualRate"),
          transaction.raw("CONVERT(VARCHAR(32), estimated_computed_total) AS estimatedTotal"),
          transaction.raw("CONVERT(VARCHAR(32), actual_computed_total) AS actualTotal")
        )
        expect(administrationCosts).toEqual([
          {
            centre_id: centreId,
            fiscal_period_id: fiscalPeriodId,
            child_care_space_category_id: null,
            line_name: "Toddlers",
            monthlyAmount: "12.5500",
            estimatedRate: "0.4000",
            actualRate: "0.2000",
            estimatedTotal: "5.0200",
            actualTotal: "2.5100",
          },
        ])

        const worksheet = await transaction("funding_submission_line_jsons")
          .select("values")
          .where({
            id: worksheetId,
          })
          .first()
        expect(worksheet?.values).toEqual("[]")
      })
    })

    test("when an existing category conflicts with a legacy name, preserves it and migrates valid neighboring data", async () => {
      await withLegacyAdministrationSchema(async (transaction) => {
        // Arrange
        const centreId = await createCentre(transaction)
        const fundingPeriodId = await createFundingPeriod(transaction)
        const fiscalPeriodId = await createAprilFiscalPeriod(transaction, fundingPeriodId)
        const conflictingSourceLineId = await createFundingSubmissionLine(transaction)
        const validSourceLineId = await createFundingSubmissionLine(transaction, {
          lineName: "Toddlers",
        })
        const existingCategoryId = await insertRow(transaction, "administration_cost_categories", {
          funding_period_id: fundingPeriodId,
          child_care_space_category_id: null,
          source_funding_submission_line_id: null,
          category_name: "Infants",
          from_age: 0,
          to_age: 1,
          monthly_amount: "90.0000",
        })
        const worksheetId = await createWorksheet(
          transaction,
          centreId,
          JSON.stringify([
            administrationValue(conflictingSourceLineId),
            administrationValue(validSourceLineId, {
              lineName: "Toddlers",
            }),
          ])
        )

        // Act
        await migrateAdministrationCosts(transaction)

        // Assert
        const existingCategories = await transaction("administration_cost_categories")
          .select(
            "id",
            "funding_period_id",
            "category_name",
            "from_age",
            "to_age",
            transaction.raw("CONVERT(VARCHAR(32), monthly_amount) AS monthlyAmount")
          )
          .where({
            id: existingCategoryId,
          })
        expect(existingCategories).toEqual([
          {
            id: existingCategoryId,
            funding_period_id: fundingPeriodId,
            category_name: "Infants",
            from_age: 0,
            to_age: 1,
            monthlyAmount: "90.0000",
          },
        ])

        const administrationCosts = await transaction("administration_costs").select(
          "centre_id",
          "fiscal_period_id",
          "child_care_space_category_id",
          "line_name",
          transaction.raw("CONVERT(VARCHAR(32), monthly_amount) AS monthlyAmount"),
          transaction.raw("CONVERT(VARCHAR(32), estimated_child_occupancy_rate) AS estimatedRate"),
          transaction.raw("CONVERT(VARCHAR(32), actual_child_occupancy_rate) AS actualRate"),
          transaction.raw("CONVERT(VARCHAR(32), estimated_computed_total) AS estimatedTotal"),
          transaction.raw("CONVERT(VARCHAR(32), actual_computed_total) AS actualTotal")
        )
        expect(administrationCosts).toEqual([
          {
            centre_id: centreId,
            fiscal_period_id: fiscalPeriodId,
            child_care_space_category_id: null,
            line_name: "Toddlers",
            monthlyAmount: "12.5500",
            estimatedRate: "0.4000",
            actualRate: "0.2000",
            estimatedTotal: "5.0200",
            actualTotal: "2.5100",
          },
        ])

        const worksheet = await transaction("funding_submission_line_jsons")
          .select("values")
          .where({
            id: worksheetId,
          })
          .first()
        expect(worksheet?.values).toEqual("[]")
      })
    })

    test("when an existing active ledger row conflicts with a legacy snapshot, preserves it and migrates valid neighboring data", async () => {
      await withLegacyAdministrationSchema(async (transaction) => {
        // Arrange
        const centreId = await createCentre(transaction)
        const fundingPeriodId = await createFundingPeriod(transaction)
        const fiscalPeriodId = await createAprilFiscalPeriod(transaction, fundingPeriodId)
        const conflictingSourceLineId = await createFundingSubmissionLine(transaction)
        const validSourceLineId = await createFundingSubmissionLine(transaction, {
          lineName: "Toddlers",
        })
        const existingCategoryId = await insertRow(transaction, "administration_cost_categories", {
          funding_period_id: fundingPeriodId,
          child_care_space_category_id: null,
          source_funding_submission_line_id: conflictingSourceLineId,
          category_name: "Infants",
          from_age: 0,
          to_age: 1,
          monthly_amount: "70.0000",
          deleted_at: null,
        })
        const createdAt = new Date("2147-04-01T10:00:00Z")
        const updatedAt = new Date("2147-04-02T11:00:00Z")
        await insertRow(transaction, "administration_costs", {
          centre_id: centreId,
          fiscal_period_id: fiscalPeriodId,
          category_id: existingCategoryId,
          child_care_space_category_id: null,
          line_name: "Existing Infant Snapshot",
          monthly_amount: "88.0000",
          estimated_child_occupancy_rate: "0.1000",
          actual_child_occupancy_rate: "0.0500",
          estimated_computed_total: "8.8000",
          actual_computed_total: "4.4000",
          created_at: createdAt,
          updated_at: updatedAt,
          deleted_at: null,
        })
        const worksheetId = await createWorksheet(
          transaction,
          centreId,
          JSON.stringify([
            administrationValue(conflictingSourceLineId),
            administrationValue(validSourceLineId, {
              lineName: "Toddlers",
            }),
          ])
        )

        // Act
        await migrateAdministrationCosts(transaction)

        // Assert
        const administrationCosts = await transaction("administration_costs").select(
          "centre_id",
          "fiscal_period_id",
          "child_care_space_category_id",
          "line_name",
          "created_at",
          "updated_at",
          "deleted_at",
          transaction.raw("CONVERT(VARCHAR(32), monthly_amount) AS monthlyAmount"),
          transaction.raw("CONVERT(VARCHAR(32), estimated_child_occupancy_rate) AS estimatedRate"),
          transaction.raw("CONVERT(VARCHAR(32), actual_child_occupancy_rate) AS actualRate"),
          transaction.raw("CONVERT(VARCHAR(32), estimated_computed_total) AS estimatedTotal"),
          transaction.raw("CONVERT(VARCHAR(32), actual_computed_total) AS actualTotal")
        )
        expect(administrationCosts).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              centre_id: centreId,
              fiscal_period_id: fiscalPeriodId,
              child_care_space_category_id: null,
              line_name: "Existing Infant Snapshot",
              created_at: createdAt,
              updated_at: updatedAt,
              deleted_at: null,
              monthlyAmount: "88.0000",
              estimatedRate: "0.1000",
              actualRate: "0.0500",
              estimatedTotal: "8.8000",
              actualTotal: "4.4000",
            }),
            expect.objectContaining({
              centre_id: centreId,
              fiscal_period_id: fiscalPeriodId,
              child_care_space_category_id: null,
              line_name: "Toddlers",
              monthlyAmount: "12.5500",
              estimatedRate: "0.4000",
              actualRate: "0.2000",
              estimatedTotal: "5.0200",
              actualTotal: "2.5100",
            }),
          ])
        )
        expect(administrationCosts).toHaveLength(2)

        const worksheet = await transaction("funding_submission_line_jsons")
          .select("values")
          .where({
            id: worksheetId,
          })
          .first()
        expect(worksheet?.values).toEqual("[]")
      })
    })

    test("when a worksheet has malformed or nonarray JSON, leaves it unchanged while migrating valid worksheets", async () => {
      await withLegacyAdministrationSchema(async (transaction) => {
        // Arrange
        const centreId = await createCentre(transaction)
        const fundingPeriodId = await createFundingPeriod(transaction)
        const fiscalPeriodId = await createAprilFiscalPeriod(transaction, fundingPeriodId)
        const sourceLineId = await createFundingSubmissionLine(transaction)
        const validWorksheetId = await createWorksheet(
          transaction,
          centreId,
          JSON.stringify([administrationValue(sourceLineId)])
        )
        const malformedValues = '[{"sectionName":"Administration"'
        const malformedWorksheetId = await createWorksheet(transaction, centreId, malformedValues)
        const nonarrayValues = JSON.stringify({
          sectionName: "Administration",
          submissionLineId: sourceLineId,
        })
        const nonarrayWorksheetId = await createWorksheet(transaction, centreId, nonarrayValues)

        // Act
        await migrateAdministrationCosts(transaction)

        // Assert
        const administrationCosts = await transaction("administration_costs").select(
          "centre_id",
          "fiscal_period_id",
          "child_care_space_category_id",
          "line_name",
          transaction.raw("CONVERT(VARCHAR(32), monthly_amount) AS monthlyAmount"),
          transaction.raw("CONVERT(VARCHAR(32), estimated_child_occupancy_rate) AS estimatedRate"),
          transaction.raw("CONVERT(VARCHAR(32), actual_child_occupancy_rate) AS actualRate"),
          transaction.raw("CONVERT(VARCHAR(32), estimated_computed_total) AS estimatedTotal"),
          transaction.raw("CONVERT(VARCHAR(32), actual_computed_total) AS actualTotal")
        )
        expect(administrationCosts).toEqual([
          {
            centre_id: centreId,
            fiscal_period_id: fiscalPeriodId,
            child_care_space_category_id: null,
            line_name: "Infants",
            monthlyAmount: "12.5500",
            estimatedRate: "0.4000",
            actualRate: "0.2000",
            estimatedTotal: "5.0200",
            actualTotal: "2.5100",
          },
        ])

        const worksheetRows = await transaction("funding_submission_line_jsons")
          .select("id", "values")
          .whereIn("id", [validWorksheetId, malformedWorksheetId, nonarrayWorksheetId])
        expect(worksheetRows).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: validWorksheetId,
              values: "[]",
            }),
            expect.objectContaining({
              id: malformedWorksheetId,
              values: malformedValues,
            }),
            expect.objectContaining({
              id: nonarrayWorksheetId,
              values: nonarrayValues,
            }),
          ])
        )
        expect(worksheetRows).toHaveLength(3)
      })
    })

    test("when an Administration ledger write fails, propagates the SQL error and rolls back cutover changes", async () => {
      await withLegacyAdministrationSchema(async (transaction) => {
        // Arrange
        const centreId = await createCentre(transaction)
        const fundingPeriodId = await createFundingPeriod(transaction)
        await createAprilFiscalPeriod(transaction, fundingPeriodId)
        const sourceLineId = await createFundingSubmissionLine(transaction)
        const worksheetValues = JSON.stringify([administrationValue(sourceLineId)])
        const worksheetId = await createWorksheet(transaction, centreId, worksheetValues)

        // Act
        await expect(
          transaction.transaction(async (nestedTransaction) => {
            await nestedTransaction.schema.dropTable("administration_costs")
            await migrateAdministrationCosts(nestedTransaction)
          })
        ).rejects.toThrow(/Invalid object name 'administration_costs'/i)

        // Assert
        const administrationCostsTableExists =
          await transaction.schema.hasTable("administration_costs")
        expect(administrationCostsTableExists).toEqual(true)

        const administrationCategories = await transaction("administration_cost_categories").select(
          "id"
        )
        expect(administrationCategories).toEqual([])

        const worksheet = await transaction("funding_submission_line_jsons")
          .select("values")
          .where({
            id: worksheetId,
          })
          .first()
        expect(worksheet?.values).toEqual(worksheetValues)

        const fundingSubmissionLine = await transaction("funding_submission_lines")
          .select("id")
          .where({
            id: sourceLineId,
          })
          .first()
        expect(fundingSubmissionLine?.id).toEqual(sourceLineId)
      })
    })
  })
})
