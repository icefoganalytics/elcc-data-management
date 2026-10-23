import type { Knex } from "knex"
import { isUndefined } from "lodash"

import { up as createQualityEnhancementCategories } from "@/db/migrations/20261020220000_create-quality-enhancement-categories-table"
import { up as createQualityEnhancements } from "@/db/migrations/20261020220001_create-quality-enhancements-table"
import { up as migrateQualityEnhancements } from "@/db/migrations/20261020220002_migrate-quality-enhancements-from-worksheet-json"
import { withLegacyChildCareSpaceSchema } from "@/db/migrations/legacy-child-care-spaces"

const SECTION_NAME = "Quality Enhancement Program"
const FUNDING_YEAR = "2024-2025"
const LEGACY_FUNDING_YEAR = "2024/25"
const APRIL_START = new Date("2024-04-01T00:00:00Z")
const APRIL_END = new Date("2024-04-30T23:59:59Z")

type IdRow = { id: number }
type QualityEnhancementRow = {
  id: number
  category_id: number
  child_care_space_category_id: number | null
  line_name: string
  base_monthly_amount: string | number
  hot_meal_increment_amount: string | number
  hot_meal_applied_at: string | Date | null
  monthly_amount: string | number
  estimated_computed_total: string | number
  actual_computed_total: string | number
  deleted_at: string | Date | null
}

async function insertRow(
  transaction: Knex.Transaction,
  tableName: string,
  attributes: Record<string, unknown>
): Promise<number> {
  const [row] = await transaction(tableName).insert(attributes).returning<IdRow[]>("id")
  if (isUndefined(row)) {
    throw new Error(`Unable to insert migration fixture row into ${tableName}.`)
  }
  return row.id
}

async function createTargetSchema(transaction: Knex.Transaction): Promise<void> {
  await createQualityEnhancementCategories(transaction)
  await createQualityEnhancements(transaction)
}

async function createFixture(transaction: Knex.Transaction) {
  const fundingRegionId = await insertRow(transaction, "funding_regions", {
    region: "Quality Enhancement Migration",
    subsidy_rate: "0.5000",
  })
  const centreId = await insertRow(transaction, "centres", {
    funding_region_id: fundingRegionId,
    name: "Quality Enhancement Migration Centre",
    community: "Whitehorse",
    status: "Active",
    is_first_nation_program: false,
  })
  const fundingPeriodId = await insertRow(transaction, "funding_periods", {
    fiscal_year: FUNDING_YEAR,
    from_date: new Date("2024-04-01T00:00:00Z"),
    to_date: new Date("2025-03-31T23:59:59Z"),
    title: "Quality Enhancement Migration Period",
  })
  const fiscalPeriodId = await insertRow(transaction, "fiscal_periods", {
    funding_period_id: fundingPeriodId,
    fiscal_year: "2024-25",
    month: "April",
    date_start: APRIL_START,
    date_end: APRIL_END,
  })
  const spaceCategoryId = await insertRow(transaction, "child_care_space_categories", {
    funding_period_id: fundingPeriodId,
    category_name: "Infants",
    from_age: 0,
    to_age: 2,
    monthly_amount: "125.0000",
  })
  const submissionLineId = await insertRow(transaction, "funding_submission_lines", {
    fiscal_year: LEGACY_FUNDING_YEAR,
    section_name: SECTION_NAME,
    line_name: "Infants",
    from_age: 0,
    to_age: 2,
    monthly_amount: "206.1000",
    child_care_space_category_id: spaceCategoryId,
  })

  return {
    centreId,
    fundingPeriodId,
    fiscalPeriodId,
    spaceCategoryId,
    submissionLineId,
  }
}

async function createWorksheet(
  transaction: Knex.Transaction,
  centreId: number,
  values: string,
  deletedAt: Date | null = null
): Promise<number> {
  return insertRow(transaction, "funding_submission_line_jsons", {
    centre_id: centreId,
    fiscal_year: LEGACY_FUNDING_YEAR,
    date_name: "April",
    date_start: APRIL_START,
    date_end: APRIL_END,
    values,
    deleted_at: deletedAt,
  })
}

describe("api/src/db/migrations/20261020220002_migrate-quality-enhancements-from-worksheet-json.ts", () => {
  describe("#up", () => {
    test("when migrating historical worksheets twice, preserves snapshots and unrelated numeric tokens without duplication", async () => {
      await withLegacyChildCareSpaceSchema(async (transaction) => {
        // Arrange
        await createTargetSchema(transaction)
        const fixture = await createFixture(transaction)
        const activeWorksheet = await createWorksheet(
          transaction,
          fixture.centreId,
          `[
          {
            "submissionLineId":${fixture.submissionLineId},
            "sectionName":"${SECTION_NAME}",
            "lineName":"Infants snapshot",
            "monthlyAmount":"216.1000",
            "estimatedChildOccupancyRate":"0.5000",
            "actualChildOccupancyRate":"0.2500",
            "estimatedComputedTotal":"101.2345",
            "actualComputedTotal":"50.1234",
            "programQualityEnhancements":{
              "preEnhancementAmount":"206.1000",
              "hot_meal":{"amount":"10.0000","appliedAt":"2024-04-10T17:30:00.000Z"}
            }
          },
          {"sectionName":"General Funding","rawDecimal":12345678901234567890.00000000000000001,"nested":{"rawInteger":900719925474099312345}}
        ]`
        )
        const archivedWorksheet = await createWorksheet(
          transaction,
          fixture.centreId,
          JSON.stringify([
            {
              submissionLineId: fixture.submissionLineId,
              sectionName: SECTION_NAME,
              lineName: "Archived infant snapshot",
              monthlyAmount: "199.9999",
              estimatedChildOccupancyRate: "0.4000",
              actualChildOccupancyRate: "0.2000",
              estimatedComputedTotal: "44.4444",
              actualComputedTotal: "22.2222",
            },
          ]),
          new Date("2024-05-02T00:00:00Z")
        )

        // Act
        await migrateQualityEnhancements(transaction)
        await migrateQualityEnhancements(transaction)

        // Assert
        const categories = await transaction("quality_enhancement_categories").select(
          "id",
          "funding_period_id",
          "category_name",
          "from_age",
          "to_age",
          "monthly_amount",
          "child_care_space_category_id"
        )
        const enhancements = await transaction.raw<QualityEnhancementRow[]>(`
        SELECT
          child_care_space_category_id,
          line_name,
          CONVERT(VARCHAR(40), base_monthly_amount) AS base_monthly_amount,
          CONVERT(VARCHAR(40), hot_meal_increment_amount) AS hot_meal_increment_amount,
          CONVERT(VARCHAR(40), monthly_amount) AS monthly_amount,
          CONVERT(VARCHAR(40), estimated_computed_total) AS estimated_computed_total,
          CONVERT(VARCHAR(40), actual_computed_total) AS actual_computed_total,
          CONVERT(VARCHAR(10), hot_meal_applied_at, 23) AS hot_meal_applied_at,
          deleted_at
        FROM quality_enhancements
        ORDER BY id
      `)
        const activeValues = await transaction("funding_submission_line_jsons")
          .select("values")
          .where({ id: activeWorksheet })
          .first()
        const archivedValues = await transaction("funding_submission_line_jsons")
          .select("values")
          .where({ id: archivedWorksheet })
          .first()
        const remainingConfiguration = await transaction("funding_submission_lines").where({
          section_name: SECTION_NAME,
        })
        expect(categories).toEqual([
          expect.objectContaining({
            funding_period_id: fixture.fundingPeriodId,
            category_name: "Infants",
            from_age: 0,
            to_age: 2,
            monthly_amount: 206.1,
            child_care_space_category_id: fixture.spaceCategoryId,
          }),
        ])
        expect(enhancements).toEqual([
          {
            child_care_space_category_id: fixture.spaceCategoryId,
            line_name: "Infants snapshot",
            base_monthly_amount: "206.1000",
            hot_meal_increment_amount: "10.0000",
            monthly_amount: "216.1000",
            estimated_computed_total: "101.2345",
            actual_computed_total: "50.1234",
            hot_meal_applied_at: "2024-04-10",
            deleted_at: null,
          },
          {
            child_care_space_category_id: fixture.spaceCategoryId,
            line_name: "Archived infant snapshot",
            base_monthly_amount: "199.9999",
            hot_meal_increment_amount: "0.0000",
            monthly_amount: "199.9999",
            estimated_computed_total: "44.4444",
            actual_computed_total: "22.2222",
            hot_meal_applied_at: null,
            deleted_at: new Date("2024-05-02T00:00:00Z"),
          },
        ])
        expect(activeValues?.values).toEqual(
          '[{"sectionName":"General Funding","rawDecimal":12345678901234567890.00000000000000001,"nested":{"rawInteger":900719925474099312345}}]'
        )
        expect(archivedValues?.values).toEqual("[]")
        expect(remainingConfiguration).toEqual([])
      })
    })

    test.each([
      {
        scenario: "base and increment disagree with the effective amount",
        monthlyAmount: "216.1000",
        preEnhancementAmount: "205.1000",
        hotMealAmount: "10.0000",
        expectedError: "inconsistent with its effective monthly amount",
      },
      {
        scenario: "base amount exceeds the supported decimal precision",
        monthlyAmount: "216.1000",
        preEnhancementAmount: "206.10001",
        hotMealAmount: "10.0000",
        expectedError: "would lose decimal precision",
      },
      {
        scenario: "effective amount exceeds the supported decimal range",
        monthlyAmount: "100000000000.0000",
        preEnhancementAmount: null,
        hotMealAmount: null,
        expectedError: "exceeds DECIMAL(15,4)",
      },
    ])(
      "when $scenario, rolls back target records and retains sources",
      async ({ monthlyAmount, preEnhancementAmount, hotMealAmount, expectedError }) => {
        await withLegacyChildCareSpaceSchema(async (transaction) => {
          // Arrange
          await createTargetSchema(transaction)
          const fixture = await createFixture(transaction)
          const line: Record<string, unknown> = {
            submissionLineId: fixture.submissionLineId,
            sectionName: SECTION_NAME,
            lineName: "Infants snapshot",
            monthlyAmount,
            estimatedChildOccupancyRate: "0.5000",
            actualChildOccupancyRate: "0.2500",
            estimatedComputedTotal: "108.0500",
            actualComputedTotal: "54.0250",
          }
          if (preEnhancementAmount !== null && hotMealAmount !== null) {
            line.programQualityEnhancements = {
              preEnhancementAmount,
              hot_meal: {
                amount: hotMealAmount,
                appliedAt: "2024-04-10T17:30:00.000Z",
              },
            }
          }
          const sourceValues = JSON.stringify([line])
          const worksheetId = await createWorksheet(transaction, fixture.centreId, sourceValues)
          // Act / Assert
          await expect(
            transaction.transaction(async (migrationTransaction) => {
              await migrateQualityEnhancements(migrationTransaction)
            })
          ).rejects.toThrow(expectedError)

          // Assert
          const sourceConfiguration = await transaction("funding_submission_lines")
            .where({ id: fixture.submissionLineId })
            .first()
          const sourceWorksheet = await transaction("funding_submission_line_jsons")
            .select("values")
            .where({ id: worksheetId })
            .first()
          const categories = await transaction("quality_enhancement_categories").select("id")
          const enhancements = await transaction("quality_enhancements").select("id")

          expect(sourceConfiguration).toEqual(
            expect.objectContaining({
              id: fixture.submissionLineId,
            })
          )
          expect(sourceWorksheet?.values).toEqual(sourceValues)
          expect(categories).toEqual([])
          expect(enhancements).toEqual([])
        })
      }
    )
  })
})
