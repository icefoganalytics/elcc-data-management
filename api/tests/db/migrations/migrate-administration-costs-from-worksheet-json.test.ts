import type { Knex } from "knex"
import { isUndefined } from "lodash"

import { up as migrateAdministrationCosts } from "@/db/migrations/20261020180002_migrate-administration-costs-from-worksheet-json"
import { withLegacyAdministrationSchema } from "@/db/migrations/legacy-administration-costs"

const FISCAL_YEAR = "2147-2148"
const LEGACY_FISCAL_YEAR = "2147/48"
const APRIL_START = new Date("2147-04-01T00:00:00Z")
const APRIL_END = new Date("2147-04-30T23:59:59Z")
const FUNDING_PERIOD_END = new Date("2148-03-31T23:59:59Z")
const ADMINISTRATION_SECTION_NAME = "Administration (10% of Spaces)"

type IdRow = { id: number }
type AdministrationValue = {
  submissionLineId: number
  sectionName: string
  lineName: string
  monthlyAmount: string
  estimatedChildOccupancyRate: string
  actualChildOccupancyRate: string
  estimatedComputedTotal?: string
  actualComputedTotal?: string
  childCareSpaceCategoryId?: number | null
}

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

async function createCentre(transaction: Knex.Transaction): Promise<number> {
  const fundingRegionId = await insertRow(transaction, "funding_regions", {
    region: "Administration Migration Fixture",
    subsidy_rate: "0.5000",
  })
  return insertRow(transaction, "centres", {
    funding_region_id: fundingRegionId,
    name: "Administration Migration Fixture Centre",
    community: "Whitehorse",
    status: "Active",
    is_first_nation_program: false,
  })
}

async function createFundingPeriod(transaction: Knex.Transaction): Promise<number> {
  return insertRow(transaction, "funding_periods", {
    fiscal_year: FISCAL_YEAR,
    from_date: APRIL_START,
    to_date: FUNDING_PERIOD_END,
    title: "Administration Migration Fixture Funding Period",
  })
}

async function createAprilFiscalPeriod(
  transaction: Knex.Transaction,
  fundingPeriodId: number
): Promise<number> {
  return insertRow(transaction, "fiscal_periods", {
    funding_period_id: fundingPeriodId,
    fiscal_year: "2147-48",
    month: "April",
    date_start: APRIL_START,
    date_end: APRIL_END,
  })
}

async function createChildCareSpaceCategory(
  transaction: Knex.Transaction,
  fundingPeriodId: number,
  categoryName: string
): Promise<number> {
  return insertRow(transaction, "child_care_space_categories", {
    funding_period_id: fundingPeriodId,
    category_name: categoryName,
    monthly_amount: "100.0000",
  })
}

async function createFundingSubmissionLine(
  transaction: Knex.Transaction,
  attributes: {
    sectionName?: string
    fiscalYear?: string
    lineName?: string
    fromAge?: number | null
    toAge?: number | null
    monthlyAmount?: string
    childCareSpaceCategoryId?: number | null
    deletedAt?: Date | null
  } = {}
): Promise<number> {
  return insertRow(transaction, "funding_submission_lines", {
    fiscal_year: attributes.fiscalYear ?? LEGACY_FISCAL_YEAR,
    section_name: attributes.sectionName ?? ADMINISTRATION_SECTION_NAME,
    line_name: attributes.lineName ?? "Infants",
    from_age: attributes.fromAge ?? 0,
    to_age: attributes.toAge ?? 1,
    monthly_amount: attributes.monthlyAmount ?? "70.0000",
    child_care_space_category_id: attributes.childCareSpaceCategoryId ?? null,
    deleted_at: attributes.deletedAt ?? null,
  })
}

async function createWorksheet(
  transaction: Knex.Transaction,
  centreId: number,
  values: string,
  fiscalYear = LEGACY_FISCAL_YEAR,
  monthName = "April"
): Promise<number> {
  return insertRow(transaction, "funding_submission_line_jsons", {
    centre_id: centreId,
    fiscal_year: fiscalYear,
    date_name: monthName,
    date_start: APRIL_START,
    date_end: APRIL_END,
    values,
  })
}

function administrationValue(
  submissionLineId: number,
  overrides: Partial<AdministrationValue> = {}
): AdministrationValue {
  return {
    submissionLineId,
    sectionName: ADMINISTRATION_SECTION_NAME,
    lineName: "Infants",
    monthlyAmount: "12.5500",
    estimatedChildOccupancyRate: "0.4000",
    actualChildOccupancyRate: "0.2000",
    estimatedComputedTotal: "5.0200",
    actualComputedTotal: "2.5100",
    ...overrides,
  }
}

describe("api/src/db/migrations/20261020180002_migrate-administration-costs-from-worksheet-json.ts", () => {
  describe("#up", () => {
    test("when current templates and retired sources exist, preserves annual category history idempotently", async () => {
      await withLegacyAdministrationSchema(async (transaction) => {
        // Arrange
        const centreId = await createCentre(transaction)
        const fundingPeriodId = await createFundingPeriod(transaction)
        const fiscalPeriodId = await createAprilFiscalPeriod(transaction, fundingPeriodId)
        const infantSpaceCategoryId = await createChildCareSpaceCategory(
          transaction,
          fundingPeriodId,
          "Infants"
        )
        const historicalSpaceCategoryId = await createChildCareSpaceCategory(
          transaction,
          fundingPeriodId,
          "Historical Infant Cohort"
        )
        const currentTemplates = [
          { lineName: "Infants", fromAge: 0, toAge: 1, monthlyAmount: "70.0000" },
          { lineName: "Toddlers", fromAge: 2, toAge: 3, monthlyAmount: "70.0000" },
          { lineName: "Preschool", fromAge: 4, toAge: 5, monthlyAmount: "70.0000" },
          { lineName: "Kindergarten (PT)", fromAge: 5, toAge: 6, monthlyAmount: "35.0000" },
          { lineName: "Kindergarten (FT)", fromAge: 5, toAge: 6, monthlyAmount: "70.0000" },
          { lineName: "School Age (PT)", fromAge: 5, toAge: 6, monthlyAmount: "30.0000" },
          { lineName: "School Age (FT)", fromAge: 5, toAge: 6, monthlyAmount: "50.0000" },
        ]
        const templateLineIds: number[] = []
        for (const template of currentTemplates) {
          templateLineIds.push(
            await createFundingSubmissionLine(transaction, {
              ...template,
              childCareSpaceCategoryId:
                template.lineName === "Infants" ? infantSpaceCategoryId : null,
            })
          )
        }
        const retiredTemplateLineId = await createFundingSubmissionLine(transaction, {
          sectionName: "Archived Administration",
          fiscalYear: "2148/49",
          lineName: "Infants",
          monthlyAmount: "70.0000",
          childCareSpaceCategoryId: infantSpaceCategoryId,
          deletedAt: new Date("2147-03-01T00:00:00Z"),
        })
        const worksheetId = await createWorksheet(
          transaction,
          centreId,
          `[${JSON.stringify(
            administrationValue(templateLineIds[0], {
              lineName: "Historical Infant Cohort",
              childCareSpaceCategoryId: historicalSpaceCategoryId,
            })
          )},${JSON.stringify(
            administrationValue(retiredTemplateLineId, {
              lineName: "Retired Infant Cohort",
              monthlyAmount: "8.0000",
              estimatedChildOccupancyRate: "0.5000",
              actualChildOccupancyRate: "0.2500",
              estimatedComputedTotal: "4.0000",
              actualComputedTotal: "2.0000",
            })
          )},{"sectionName":"Quality Enhancement Program","monthlyAmount":1.2300,"originalNumber":9007199254740993,"unknown":{"kept":true}}]`
        )

        // Act
        await migrateAdministrationCosts(transaction)
        await migrateAdministrationCosts(transaction)

        // Assert
        const administrationCategories = await transaction("administration_cost_categories").select(
          "id",
          { fundingPeriodId: "funding_period_id" },
          { childCareSpaceCategoryId: "child_care_space_category_id" },
          { categoryName: "category_name" },
          { fromAge: "from_age" },
          { toAge: "to_age" },
          transaction.raw("CONVERT(VARCHAR(32), monthly_amount) AS monthlyAmount"),
          "deleted_at"
        )
        expect(administrationCategories).toEqual([
          expect.objectContaining({
            fundingPeriodId,
            childCareSpaceCategoryId: infantSpaceCategoryId,
            categoryName: "Infants",
            fromAge: 0,
            toAge: 1,
            monthlyAmount: "70.0000",
            deleted_at: null,
          }),
          expect.objectContaining({
            fundingPeriodId,
            categoryName: "Toddlers",
            fromAge: 2,
            toAge: 3,
            monthlyAmount: "70.0000",
            deleted_at: null,
          }),
          expect.objectContaining({
            fundingPeriodId,
            categoryName: "Preschool",
            fromAge: 4,
            toAge: 5,
            monthlyAmount: "70.0000",
            deleted_at: null,
          }),
          expect.objectContaining({
            fundingPeriodId,
            categoryName: "Kindergarten (PT)",
            fromAge: 5,
            toAge: 6,
            monthlyAmount: "35.0000",
            deleted_at: null,
          }),
          expect.objectContaining({
            fundingPeriodId,
            categoryName: "Kindergarten (FT)",
            fromAge: 5,
            toAge: 6,
            monthlyAmount: "70.0000",
            deleted_at: null,
          }),
          expect.objectContaining({
            fundingPeriodId,
            categoryName: "School Age (PT)",
            fromAge: 5,
            toAge: 6,
            monthlyAmount: "30.0000",
            deleted_at: null,
          }),
          expect.objectContaining({
            fundingPeriodId,
            categoryName: "School Age (FT)",
            monthlyAmount: "50.0000",
            deleted_at: null,
          }),
          expect.objectContaining({
            fundingPeriodId,
            childCareSpaceCategoryId: infantSpaceCategoryId,
            categoryName: "Infants",
            monthlyAmount: "70.0000",
            deleted_at: expect.anything(),
          }),
        ])
      })
    })

    test("when monthly snapshots differ from current configuration, preserves historical rates and links", async () => {
      await withLegacyAdministrationSchema(async (transaction) => {
        // Arrange
        const centreId = await createCentre(transaction)
        const fundingPeriodId = await createFundingPeriod(transaction)
        const fiscalPeriodId = await createAprilFiscalPeriod(transaction, fundingPeriodId)
        const childCareSpaceCategoryId = await createChildCareSpaceCategory(
          transaction,
          fundingPeriodId,
          "Infants"
        )
        const historicalSpaceCategoryId = await createChildCareSpaceCategory(
          transaction,
          fundingPeriodId,
          "Historical Infant Cohort"
        )
        const sourceLineId = await createFundingSubmissionLine(transaction, {
          childCareSpaceCategoryId,
          monthlyAmount: "70.0000",
        })
        await createWorksheet(
          transaction,
          centreId,
          JSON.stringify([
            administrationValue(sourceLineId, {
              lineName: "Historical Infant Cohort",
              childCareSpaceCategoryId: historicalSpaceCategoryId,
            }),
          ])
        )

        // Act
        await migrateAdministrationCosts(transaction)
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
            child_care_space_category_id: historicalSpaceCategoryId,
            line_name: "Historical Infant Cohort",
            monthlyAmount: "12.5500",
            estimatedRate: "0.4000",
            actualRate: "0.2000",
            estimatedTotal: "5.0200",
            actualTotal: "2.5100",
          },
        ])
      })
    })

    test("when Administration is removed from JSON, preserves unrelated raw numeric tokens and unknown properties", async () => {
      await withLegacyAdministrationSchema(async (transaction) => {
        // Arrange
        const centreId = await createCentre(transaction)
        const fundingPeriodId = await createFundingPeriod(transaction)
        await createAprilFiscalPeriod(transaction, fundingPeriodId)
        const sourceLineId = await createFundingSubmissionLine(transaction)
        const retainedJson =
          '{"sectionName":"Quality Enhancement Program","monthlyAmount":1.2300,"originalNumber":9007199254740993,"unknown":{"kept":true}}'
        const worksheetId = await createWorksheet(
          transaction,
          centreId,
          `[${JSON.stringify(administrationValue(sourceLineId))},${retainedJson}]`
        )

        // Act
        await migrateAdministrationCosts(transaction)

        // Assert
        const worksheet = await transaction("funding_submission_line_jsons")
          .where({ id: worksheetId })
          .first("values")
        expect(worksheet?.values).toEqual(
          '[{"sectionName":"Quality Enhancement Program","monthlyAmount":1.2300,"originalNumber":9007199254740993,"unknown":{"kept":true}}]'
        )
      })
    })

    test("when configuration has been migrated, removes only retired Administration sources", async () => {
      await withLegacyAdministrationSchema(async (transaction) => {
        // Arrange
        await createFundingPeriod(transaction)
        await createFundingSubmissionLine(transaction)
        const otherSourceId = await createFundingSubmissionLine(transaction, {
          sectionName: "Quality Enhancement Program",
        })

        // Act
        await migrateAdministrationCosts(transaction)

        // Assert
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

    test("when active worksheet snapshots conflict, rolls back category and worksheet changes", async () => {
      await withLegacyAdministrationSchema(async (transaction) => {
        // Arrange
        const centreId = await createCentre(transaction)
        const fundingPeriodId = await createFundingPeriod(transaction)
        await createAprilFiscalPeriod(transaction, fundingPeriodId)
        const sourceLineId = await createFundingSubmissionLine(transaction)
        const firstWorksheetId = await createWorksheet(
          transaction,
          centreId,
          JSON.stringify([administrationValue(sourceLineId)])
        )
        const conflictingWorksheetId = await createWorksheet(
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
        await expect(
          transaction.transaction((nestedTransaction) =>
            migrateAdministrationCosts(nestedTransaction)
          )
        ).rejects.toThrow("duplicate active snapshots")

        // Assert
        const administrationCategories = await transaction("administration_cost_categories").select(
          "id"
        )
        expect(administrationCategories).toEqual([])

        const worksheetRows = await transaction("funding_submission_line_jsons")
          .select("id", "values")
          .whereIn("id", [firstWorksheetId, conflictingWorksheetId])
        expect(worksheetRows).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: firstWorksheetId,
              values: JSON.stringify([administrationValue(sourceLineId)]),
            }),
            expect.objectContaining({
              id: conflictingWorksheetId,
              values: JSON.stringify([
                administrationValue(sourceLineId, {
                  monthlyAmount: "99.0000",
                  estimatedComputedTotal: "39.6000",
                  actualComputedTotal: "19.8000",
                }),
              ]),
            }),
          ])
        )
        expect(worksheetRows).toHaveLength(2)
      })
    })

    test("when an Administration source is referenced by another section, preserves both source records", async () => {
      await withLegacyAdministrationSchema(async (transaction) => {
        // Arrange
        const centreId = await createCentre(transaction)
        const fundingPeriodId = await createFundingPeriod(transaction)
        await createAprilFiscalPeriod(transaction, fundingPeriodId)
        const sourceLineId = await createFundingSubmissionLine(transaction)
        const worksheetValues = JSON.stringify([
          administrationValue(sourceLineId),
          {
            sectionName: "Quality Enhancement Program",
            submissionLineId: sourceLineId,
          },
        ])
        const worksheetId = await createWorksheet(transaction, centreId, worksheetValues)

        // Act
        await expect(
          transaction.transaction((nestedTransaction) =>
            migrateAdministrationCosts(nestedTransaction)
          )
        ).rejects.toThrow("referenced by non-Administration worksheet")

        // Assert
        const worksheet = await transaction("funding_submission_line_jsons")
          .select("values")
          .where({ id: worksheetId })
          .first()
        const fundingSubmissionLine = await transaction("funding_submission_lines")
          .select("id")
          .where({ id: sourceLineId })
          .first()
        expect(worksheet?.values).toEqual(worksheetValues)
        expect(fundingSubmissionLine?.id).toEqual(sourceLineId)
      })
    })

    test("when an Administration value references no funding submission line, rejects migration without removing the source JSON", async () => {
      await withLegacyAdministrationSchema(async (transaction) => {
        // Arrange
        const centreId = await createCentre(transaction)
        const fundingPeriodId = await createFundingPeriod(transaction)
        await createAprilFiscalPeriod(transaction, fundingPeriodId)
        const worksheetValues = JSON.stringify([administrationValue(999_999_999)])
        const worksheetId = await createWorksheet(transaction, centreId, worksheetValues)

        // Act
        await expect(
          transaction.transaction((nestedTransaction) =>
            migrateAdministrationCosts(nestedTransaction)
          )
        ).rejects.toThrow("references missing funding submission line")

        // Assert
        const worksheet = await transaction("funding_submission_line_jsons")
          .select("values")
          .where({ id: worksheetId })
          .first()
        expect(worksheet?.values).toEqual(worksheetValues)
      })
    })

    test("when an Administration worksheet has no matching fiscal period, preserves its source data", async () => {
      await withLegacyAdministrationSchema(async (transaction) => {
        // Arrange
        const centreId = await createCentre(transaction)
        await createFundingPeriod(transaction)
        const sourceLineId = await createFundingSubmissionLine(transaction)
        const worksheetValues = JSON.stringify([administrationValue(sourceLineId)])
        const worksheetId = await createWorksheet(transaction, centreId, worksheetValues)

        // Act
        await expect(
          transaction.transaction((nestedTransaction) =>
            migrateAdministrationCosts(nestedTransaction)
          )
        ).rejects.toThrow("has 0 matching fiscal periods")

        // Assert
        const worksheet = await transaction("funding_submission_line_jsons")
          .select("values")
          .where({ id: worksheetId })
          .first()
        expect(worksheet?.values).toEqual(worksheetValues)

        const administrationCategories = await transaction("administration_cost_categories").select(
          "id"
        )
        expect(administrationCategories).toEqual([])
      })
    })

    test("when a historical submission-line ID is a numeric string, rejects it before configuration removal", async () => {
      await withLegacyAdministrationSchema(async (transaction) => {
        // Arrange
        const centreId = await createCentre(transaction)
        const fundingPeriodId = await createFundingPeriod(transaction)
        await createAprilFiscalPeriod(transaction, fundingPeriodId)
        const sourceLineId = await createFundingSubmissionLine(transaction)
        const worksheetValues = JSON.stringify([
          {
            ...administrationValue(sourceLineId),
            submissionLineId: String(sourceLineId),
          },
        ])
        const worksheetId = await createWorksheet(transaction, centreId, worksheetValues)

        // Act
        await expect(
          transaction.transaction((nestedTransaction) =>
            migrateAdministrationCosts(nestedTransaction)
          )
        ).rejects.toThrow("has invalid submissionLineId")

        // Assert
        const worksheet = await transaction("funding_submission_line_jsons")
          .select("values")
          .where({ id: worksheetId })
          .first()
        expect(worksheet?.values).toEqual(worksheetValues)

        const fundingSubmissionLine = await transaction("funding_submission_lines")
          .select("id")
          .where({ id: sourceLineId })
          .first()
        expect(fundingSubmissionLine?.id).toEqual(sourceLineId)
      })
    })

    test("when a historical amount exceeds four-decimal precision, rejects migration without removing its source", async () => {
      await withLegacyAdministrationSchema(async (transaction) => {
        // Arrange
        const centreId = await createCentre(transaction)
        const fundingPeriodId = await createFundingPeriod(transaction)
        await createAprilFiscalPeriod(transaction, fundingPeriodId)
        const sourceLineId = await createFundingSubmissionLine(transaction)
        const worksheetValues = `[${JSON.stringify(
          administrationValue(sourceLineId, {
            monthlyAmount: "12.34567",
            estimatedComputedTotal: "4.938268",
            actualComputedTotal: "2.469134",
          })
        )}]`
        const worksheetId = await createWorksheet(transaction, centreId, worksheetValues)

        // Act
        await expect(
          transaction.transaction((nestedTransaction) =>
            migrateAdministrationCosts(nestedTransaction)
          )
        ).rejects.toThrow("cannot be represented exactly as DECIMAL(15, 4)")

        // Assert
        const worksheet = await transaction("funding_submission_line_jsons")
          .select("values")
          .where({ id: worksheetId })
          .first()
        expect(worksheet?.values).toEqual(worksheetValues)
      })
    })

    test.each([".0", "e0"])(
      "when another section references an Administration source with an integral %s ID, rejects source removal",
      async (numericSuffix) => {
        await withLegacyAdministrationSchema(async (transaction) => {
          // Arrange
          const centreId = await createCentre(transaction)
          const fundingPeriodId = await createFundingPeriod(transaction)
          await createAprilFiscalPeriod(transaction, fundingPeriodId)
          const sourceLineId = await createFundingSubmissionLine(transaction)
          await createWorksheet(
            transaction,
            centreId,
            `[{"submissionLineId":${sourceLineId}${numericSuffix},"sectionName":"Quality Enhancement Program"}]`
          )

          // Act
          const migration = transaction.transaction((nestedTransaction) =>
            migrateAdministrationCosts(nestedTransaction)
          )

          // Assert
          await expect(migration).rejects.toThrow("is referenced by non-Administration worksheet")
        })
      }
    )
  })
})
