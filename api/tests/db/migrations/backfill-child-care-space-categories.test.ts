import { QueryTypes, TransactionNestMode, sql } from "@sequelize/core"

import db, {
  ChildCareSpace,
  ChildCareSpaceCategory,
  FiscalPeriod,
  FundingSubmissionLine,
  FundingSubmissionLineJson,
} from "@/models"
import { type Migration } from "@/db/umzug"
import { up as migrateWorksheetValues } from "@/db/migrations/2026.10.07T17.43.15.migrate-child-care-spaces-from-worksheet-json"
import { up as addCategoryId } from "@/db/migrations/2026.10.09T02.16.03.add-category-id-to-child-care-spaces"
import { up as backfillCategories } from "@/db/migrations/2026.10.09T02.16.07.backfill-child-care-space-categories"
import { up as replaceLegacyReference } from "@/db/migrations/2026.10.09T02.16.10.replace-child-care-spaces-funding-submission-line-id-with-category-id"
import { up as removeLegacyConfiguration } from "@/db/migrations/2026.10.09T02.16.13.remove-child-care-spaces-from-funding-submission-lines"
import { up as linkCategories } from "@/db/migrations/2026.10.09T02.43.01.link-funding-submission-lines-to-child-care-space-categories"
import {
  createLegacyChildCareSpace,
  findLegacyChildCareSpaces,
  withLegacyChildCareSpaceSchema,
} from "@/db/migrations/legacy-child-care-spaces"
import {
  centreFactory,
  fiscalPeriodFactory,
  fundingPeriodFactory,
  fundingSubmissionLineFactory,
  fundingSubmissionLineJsonFactory,
} from "@/factories"

const migration = { context: db.queryInterface } as Migration

describe("api/src/db/migrations/2026.10.09T02.16.07.backfill-child-care-space-categories.ts", () => {
  describe("#up", () => {
    test("when historical space and JSON labels differ, links administration metadata by category ID", async () => {
      await withLegacyChildCareSpaceSchema(async () => {
        // Arrange
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2024-2025" })
        const fiscalPeriod = await fiscalPeriodFactory.associations({ fundingPeriod }).create({
          fiscalYear: "2024-25",
          month: FiscalPeriod.Months.APRIL,
        })
        const centre = await centreFactory.create()
        const fundingSubmissionLine1 = await fundingSubmissionLineFactory.create({
          fiscalYear: "2024/25",
          sectionName: "Child Care Spaces",
          lineName: "Infants",
          fromAge: 0,
          toAge: 18,
          monthlyAmount: "100.0000",
        })
        const fundingSubmissionLine2 = await fundingSubmissionLineFactory.create({
          fiscalYear: "2025/26",
          sectionName: "Archived Child Care Spaces",
          lineName: "Retired Toddlers",
          fromAge: 19,
          toAge: 36,
          monthlyAmount: "80.0000",
        })
        await fundingSubmissionLine2.destroy()
        const administrationLine = await fundingSubmissionLineFactory.create({
          fiscalYear: "2024/25",
          sectionName: "Administration (10% of Spaces)",
          lineName: "Infants",
          monthlyAmount: "10.0000",
        })
        const legacyChildCareSpace = await createLegacyChildCareSpace({
          centreId: centre.id,
          fiscalPeriodId: fiscalPeriod.id,
          fundingSubmissionLineId: fundingSubmissionLine2.id,
          lineName: "Historical Toddler Cohort",
          monthlyAmount: "125.5000",
          estimatedChildOccupancyRate: "0.4000",
          actualChildOccupancyRate: "0.2000",
        })
        const retainedLine = {
          submissionLineId: administrationLine.id,
          sectionName: administrationLine.sectionName,
          lineName: administrationLine.lineName,
          monthlyAmount: administrationLine.monthlyAmount,
          actualComputedTotal: "1.0000",
        }
        const worksheet = fundingSubmissionLineJsonFactory.associations({ centre }).build({
          fiscalYear: "2024/25",
          dateName: FundingSubmissionLineJson.Months.APRIL,
          values: JSON.stringify([
            {
              submissionLineId: fundingSubmissionLine1.id,
              sectionName: "Child Care Spaces",
              lineName: "Historical Infant Cohort",
              monthlyAmount: "250.0000",
              estimatedChildOccupancyRate: "0.5000",
              actualChildOccupancyRate: "0.1000",
              estimatedComputedTotal: "125.0000",
              actualComputedTotal: "25.0000",
            },
            retainedLine,
          ]),
        })
        await worksheet.save({ validate: false })
        await migrateWorksheetValues(migration)
        const snapshotsBefore = await findLegacyChildCareSpaces()
        await addCategoryId(migration)

        // Act
        await backfillCategories(migration)
        await backfillCategories(migration)
        const snapshotsAfter = await findLegacyChildCareSpaces()
        await replaceLegacyReference(migration)
        await removeLegacyConfiguration(migration)
        await db.queryInterface.removeColumn(
          "funding_submission_lines",
          "child_care_space_category_id"
        )
        await linkCategories(migration)

        // Assert
        await worksheet.reload()
        const categories = await ChildCareSpaceCategory.findAll({
          paranoid: false,
          order: [["categoryName", "ASC"]],
        })
        const spaces = await ChildCareSpace.findAll({ order: [["categoryId", "ASC"]] })
        const configuration = await FundingSubmissionLine.findAll({
          paranoid: false,
          order: [["id", "ASC"]],
        })
        const categoryColumns = await db.queryInterface.describeTable("child_care_space_categories")
        const ledgerColumns = await db.queryInterface.describeTable("child_care_spaces")
        expect({
          snapshotsBefore,
          snapshotsAfter,
          categories,
          spaces,
          worksheetLines: worksheet.lines,
          configuration,
          legacyColumn: ledgerColumns.funding_submission_line_id,
          temporaryColumn: categoryColumns.source_funding_submission_line_id,
        }).toEqual({
          snapshotsBefore,
          snapshotsAfter: snapshotsBefore,
          categories: [
            expect.objectContaining({
              fundingPeriodId: fundingPeriod.id,
              categoryName: "Infants",
              fromAge: 0,
              toAge: 18,
              monthlyAmount: "100",
              deletedAt: null,
            }),
            expect.objectContaining({
              fundingPeriodId: fundingPeriod.id,
              categoryName: "Retired Toddlers",
              fromAge: 19,
              toAge: 36,
              monthlyAmount: "80",
              deletedAt: expect.any(Date),
            }),
          ],
          spaces: expect.arrayContaining([
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
          ]),
          worksheetLines: [
            {
              ...retainedLine,
              childCareSpaceCategoryId: categories[0].id,
            },
          ],
          configuration: [
            expect.objectContaining({
              id: fundingSubmissionLine2.id,
              sectionName: "Archived Child Care Spaces",
              deletedAt: expect.any(Date),
            }),
            expect.objectContaining({
              id: administrationLine.id,
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
      await withLegacyChildCareSpaceSchema(async () => {
        // Arrange
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2024-2025" })
        const fiscalPeriod = await fiscalPeriodFactory.associations({ fundingPeriod }).create({
          fiscalYear: "2024-25",
          month: FiscalPeriod.Months.APRIL,
        })
        const centre = await centreFactory.create()
        const childCareSpacesLine = await fundingSubmissionLineFactory.create({
          fiscalYear: "2024/25",
          sectionName: "Child Care Spaces",
          lineName: "Infants",
          monthlyAmount: "100.0000",
        })
        const renamedLine = await fundingSubmissionLineFactory.create({
          fiscalYear: "2024/25",
          sectionName: "General Program",
          lineName: "Historical Toddlers",
          monthlyAmount: "80.0000",
        })
        const currentCategoryHistory = await createLegacyChildCareSpace({
          centreId: centre.id,
          fiscalPeriodId: fiscalPeriod.id,
          fundingSubmissionLineId: childCareSpacesLine.id,
          lineName: "Historical Infants",
          monthlyAmount: "125.5000",
          estimatedChildOccupancyRate: "0.4000",
          actualChildOccupancyRate: "0.2000",
        })
        const renamedCategoryHistory = await createLegacyChildCareSpace({
          centreId: centre.id,
          fiscalPeriodId: fiscalPeriod.id,
          fundingSubmissionLineId: renamedLine.id,
          lineName: "Historical Toddler Cohort",
          monthlyAmount: "90.0000",
          estimatedChildOccupancyRate: "0.5000",
          actualChildOccupancyRate: "0.2500",
        })
        const snapshotsBefore = await findLegacyChildCareSpaces()
        await addCategoryId(migration)

        // Act
        await backfillCategories(migration)
        const snapshotsAfter = await findLegacyChildCareSpaces()
        await replaceLegacyReference(migration)
        await removeLegacyConfiguration(migration)

        // Assert
        const configuration = await FundingSubmissionLine.findAll({
          paranoid: false,
          order: [["id", "ASC"]],
        })
        const spaces = await ChildCareSpace.findAll({ order: [["id", "ASC"]] })
        expect({
          configuration,
          spaces,
          snapshotsBefore,
          snapshotsAfter,
        }).toEqual({
          configuration: [
            expect.objectContaining({
              id: renamedLine.id,
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
      await withLegacyChildCareSpaceSchema(async () => {
        // Arrange
        const fundingPeriod1 = await fundingPeriodFactory.create({ fiscalYear: "2024-2025" })
        const fundingPeriod2 = await fundingPeriodFactory.create({ fiscalYear: "2025-2026" })
        const fiscalPeriod = await fiscalPeriodFactory
          .associations({ fundingPeriod: fundingPeriod1 })
          .create()
        const centre = await centreFactory.create()
        const fundingSubmissionLine = await fundingSubmissionLineFactory.create({
          fiscalYear: "2025/26",
          sectionName: "Child Care Spaces",
          lineName: "Infants",
          monthlyAmount: "300.0000",
        })
        const childCareSpace = await createLegacyChildCareSpace({
          centreId: centre.id,
          fiscalPeriodId: fiscalPeriod.id,
          fundingSubmissionLineId: fundingSubmissionLine.id,
          lineName: "Historical Infants",
          monthlyAmount: "100.0000",
          estimatedChildOccupancyRate: "0.5000",
          actualChildOccupancyRate: "0.2500",
        })
        await addCategoryId(migration)

        // Act
        await backfillCategories(migration)
        await replaceLegacyReference(migration)
        await removeLegacyConfiguration(migration)

        // Assert
        const categories = await ChildCareSpaceCategory.findAll({
          paranoid: false,
          order: [["fundingPeriodId", "ASC"]],
        })
        const historicalSpace = await ChildCareSpace.findByPk(childCareSpace.id, {
          rejectOnEmpty: true,
        })
        expect({ categories, historicalSpace }).toEqual({
          categories: [
            expect.objectContaining({
              fundingPeriodId: fundingPeriod1.id,
              categoryName: "Infants",
              monthlyAmount: "300",
              deletedAt: expect.any(Date),
            }),
            expect.objectContaining({
              fundingPeriodId: fundingPeriod2.id,
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
      await withLegacyChildCareSpaceSchema(async () => {
        // Arrange
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2024-2025" })
        const fiscalPeriod = await fiscalPeriodFactory.associations({ fundingPeriod }).create()
        const centre = await centreFactory.create()
        const fundingSubmissionLine1 = await fundingSubmissionLineFactory.create({
          fiscalYear: "2024/25",
          sectionName: "Child Care Spaces",
          lineName: "Infants",
        })
        const fundingSubmissionLine2 = await fundingSubmissionLineFactory.create({
          fiscalYear: "2024/25",
          sectionName: "Child Care Spaces",
          lineName: "Toddlers",
        })
        const childCareSpace1 = await createLegacyChildCareSpace({
          centreId: centre.id,
          fiscalPeriodId: fiscalPeriod.id,
          fundingSubmissionLineId: fundingSubmissionLine1.id,
          lineName: "Infants",
          monthlyAmount: "100.0000",
          estimatedChildOccupancyRate: "0.5000",
          actualChildOccupancyRate: "0.2500",
        })
        const childCareSpace2 = await createLegacyChildCareSpace({
          centreId: centre.id,
          fiscalPeriodId: fiscalPeriod.id,
          fundingSubmissionLineId: fundingSubmissionLine2.id,
          lineName: "Toddlers",
          monthlyAmount: "100.0000",
          estimatedChildOccupancyRate: "0.5000",
          actualChildOccupancyRate: "0.2500",
        })
        await addCategoryId(migration)
        const wrongCategory = await ChildCareSpaceCategory.create({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "Unrelated Category",
          fromAge: null,
          toAge: null,
          monthlyAmount: "5.0000",
        })
        await db.query(
          sql`
            UPDATE child_care_spaces
            SET
              category_id = :categoryId
            WHERE
              id = :id
          `,
          {
            type: QueryTypes.UPDATE,
            replacements: { categoryId: wrongCategory.id, id: childCareSpace2.id },
          }
        )

        // Act
        // marlens-test-alignment: allow-multiple-expects -- failure and complete rollback are independent observable contracts.
        await expect(
          db.transaction({ nestMode: TransactionNestMode.savepoint }, () =>
            backfillCategories(migration)
          )
        ).rejects.toThrow(
          `Unable to resolve the category for Child Care Space ${childCareSpace2.id}.`
        )

        // Assert
        const categories = await ChildCareSpaceCategory.findAll({ paranoid: false })
        const references = await db.query<{ id: number; categoryId: number | null }>(
          sql`
            SELECT
              id,
              category_id AS categoryId
            FROM
              child_care_spaces
            ORDER BY
              id
          `,
          { type: QueryTypes.SELECT }
        )
        expect({ categories, references }).toEqual({
          categories: [
            expect.objectContaining({ id: wrongCategory.id, categoryName: "Unrelated Category" }),
          ],
          references: [
            { id: childCareSpace1.id, categoryId: null },
            { id: childCareSpace2.id, categoryId: wrongCategory.id },
          ],
        })
      })
    })
  })
})
