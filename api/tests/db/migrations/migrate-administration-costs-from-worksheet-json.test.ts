import {
  administrationValue,
  createAprilFiscalPeriod,
  createCentre,
  createChildCareSpaceCategory,
  createFundingPeriod,
  createFundingSubmissionLine,
  createWorksheet,
  insertRow,
  withLegacyAdministrationSchema,
} from "@/db/migrations/legacy-administration-costs"

import { up as migrateAdministrationCosts } from "@/db/migrations/20261020180002_migrate-administration-costs-from-worksheet-json"

describe("api/src/db/migrations/20261020180002_migrate-administration-costs-from-worksheet-json.ts", () => {
  describe("#up", () => {
    test("when current templates and retired sources exist, preserves annual category history idempotently", async () => {
      await withLegacyAdministrationSchema(async (transaction) => {
        // Arrange
        const centreId = await createCentre(transaction)
        const fundingPeriodId = await createFundingPeriod(transaction)
        await createAprilFiscalPeriod(transaction, fundingPeriodId)
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
          {
            lineName: "Infants",
            fromAge: 0,
            toAge: 1,
            monthlyAmount: "70.0000",
          },
          {
            lineName: "Toddlers",
            fromAge: 2,
            toAge: 3,
            monthlyAmount: "70.0000",
          },
          {
            lineName: "Preschool",
            fromAge: 4,
            toAge: 5,
            monthlyAmount: "70.0000",
          },
          {
            lineName: "Kindergarten (PT)",
            fromAge: 5,
            toAge: 6,
            monthlyAmount: "35.0000",
          },
          {
            lineName: "Kindergarten (FT)",
            fromAge: 5,
            toAge: 6,
            monthlyAmount: "70.0000",
          },
          {
            lineName: "School Age (PT)",
            fromAge: 5,
            toAge: 6,
            monthlyAmount: "30.0000",
          },
          {
            lineName: "School Age (FT)",
            fromAge: 5,
            toAge: 6,
            monthlyAmount: "50.0000",
          },
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
        await createWorksheet(
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
          {
            fundingPeriodId: "funding_period_id",
          },
          {
            childCareSpaceCategoryId: "child_care_space_category_id",
          },
          {
            categoryName: "category_name",
          },
          {
            fromAge: "from_age",
          },
          {
            toAge: "to_age",
          },
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
            childCareSpaceCategoryId: null,
            categoryName: "Infants",
            monthlyAmount: "70.0000",
            deleted_at: expect.anything(),
          }),
        ])
      })
    })

    test("when a historical snapshot omits its link, preserves null instead of the current template link", async () => {
      await withLegacyAdministrationSchema(async (transaction) => {
        // Arrange
        const centreId = await createCentre(transaction)
        const fundingPeriodId = await createFundingPeriod(transaction)
        await createAprilFiscalPeriod(transaction, fundingPeriodId)
        const childCareSpaceCategoryId = await createChildCareSpaceCategory(
          transaction,
          fundingPeriodId,
          "Infants"
        )
        const sourceLineId = await createFundingSubmissionLine(transaction, {
          childCareSpaceCategoryId,
        })
        await createWorksheet(
          transaction,
          centreId,
          JSON.stringify([administrationValue(sourceLineId)])
        )

        // Act
        await migrateAdministrationCosts(transaction)
        await migrateAdministrationCosts(transaction)

        // Assert
        const administrationCosts = await transaction("administration_costs").select(
          "child_care_space_category_id"
        )
        expect(administrationCosts).toEqual([
          {
            child_care_space_category_id: null,
          },
        ])
      })
    })

    test("when a source moves to a later year, preserves its older linked snapshot idempotently", async () => {
      await withLegacyAdministrationSchema(async (transaction) => {
        // Arrange
        const centreId = await createCentre(transaction)
        const historicalFundingPeriodId = await createFundingPeriod(transaction)
        await createAprilFiscalPeriod(transaction, historicalFundingPeriodId)
        const currentFundingPeriodId = await insertRow(transaction, "funding_periods", {
          fiscal_year: "2148-2149",
          from_date: new Date("2148-04-01T00:00:00Z"),
          to_date: new Date("2149-03-31T23:59:59Z"),
          title: "Current Administration Fixture Funding Period",
        })
        const historicalSpaceCategoryId = await createChildCareSpaceCategory(
          transaction,
          historicalFundingPeriodId,
          "Historical Infants"
        )
        const currentSpaceCategoryId = await createChildCareSpaceCategory(
          transaction,
          currentFundingPeriodId,
          "Current Infants"
        )
        const sourceLineId = await createFundingSubmissionLine(transaction, {
          fiscalYear: "2148/49",
          childCareSpaceCategoryId: currentSpaceCategoryId,
        })
        await createWorksheet(
          transaction,
          centreId,
          JSON.stringify([
            administrationValue(sourceLineId, {
              childCareSpaceCategoryId: historicalSpaceCategoryId,
            }),
          ])
        )

        // Act
        await migrateAdministrationCosts(transaction)
        await migrateAdministrationCosts(transaction)

        // Assert
        const administrationCosts = await transaction("administration_costs")
          .join(
            "administration_cost_categories",
            "administration_cost_categories.id",
            "administration_costs.category_id"
          )
          .select(
            {
              fundingPeriodId: "administration_cost_categories.funding_period_id",
            },
            {
              categoryLink: "administration_cost_categories.child_care_space_category_id",
            },
            {
              snapshotLink: "administration_costs.child_care_space_category_id",
            },
            {
              categoryDeletedAt: "administration_cost_categories.deleted_at",
            }
          )
        expect(administrationCosts).toEqual([
          {
            fundingPeriodId: historicalFundingPeriodId,
            categoryLink: null,
            snapshotLink: historicalSpaceCategoryId,
            categoryDeletedAt: expect.anything(),
          },
        ])
      })
    })

    test("when deleted monthly snapshots differ from current configuration, preserves historical values and timestamps", async () => {
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
        const createdAt = new Date("2147-04-10T12:00:00Z")
        const updatedAt = new Date("2147-04-11T12:30:00Z")
        const deletedAt = new Date("2147-04-12T15:45:00Z")
        const worksheetId = await createWorksheet(
          transaction,
          centreId,
          JSON.stringify([
            administrationValue(sourceLineId, {
              lineName: "Historical Infant Cohort",
              childCareSpaceCategoryId: historicalSpaceCategoryId,
            }),
          ])
        )
        await transaction("funding_submission_line_jsons")
          .where({
            id: worksheetId,
          })
          .update({
            created_at: createdAt,
            updated_at: updatedAt,
            deleted_at: deletedAt,
          })

        // Act
        await migrateAdministrationCosts(transaction)
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
        expect(administrationCosts).toEqual([
          {
            centre_id: centreId,
            fiscal_period_id: fiscalPeriodId,
            child_care_space_category_id: historicalSpaceCategoryId,
            line_name: "Historical Infant Cohort",
            created_at: createdAt,
            updated_at: updatedAt,
            deleted_at: deletedAt,
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
          .where({
            id: worksheetId,
          })
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
  })
})
