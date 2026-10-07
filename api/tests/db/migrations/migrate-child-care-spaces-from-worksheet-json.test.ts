import db, { ChildCareSpace, FundingSubmissionLineJson } from "@/models"
import { FiscalPeriodMonths } from "@/models/fiscal-period"
import { FundingSubmissionLineJsonMonths } from "@/models/funding-submission-line-json"
import { up as migrateChildCareSpaces } from "@/db/migrations/2026.10.07T17.43.15.migrate-child-care-spaces-from-worksheet-json"
import { type Migration } from "@/db/umzug"
import {
  centreFactory,
  childCareSpaceFactory,
  fiscalPeriodFactory,
  fundingPeriodFactory,
  fundingSubmissionLineFactory,
  fundingSubmissionLineJsonFactory,
} from "@/factories"

describe("api/src/db/migrations/2026.10.07T17.43.15.migrate-child-care-spaces-from-worksheet-json.ts", () => {
  describe("#up", () => {
    test("when active, conflicting, and unresolved worksheets have Child Care Spaces values, migrates only non-conflicting resolvable values without duplication", async () => {
      // Arrange
      const centre = await centreFactory.create()
      const fundingPeriod = await fundingPeriodFactory.create({
        fiscalYear: "2024-2025",
      })
      const fiscalPeriod = await fiscalPeriodFactory.associations({ fundingPeriod }).create({
        fiscalYear: "2024-25",
        month: FiscalPeriodMonths.APRIL,
        dateStart: new Date("2024-04-01T00:00:00Z"),
        dateEnd: new Date("2024-04-30T23:59:59Z"),
      })
      const childCareSpacesFundingSubmissionLine = await fundingSubmissionLineFactory.create({
        fiscalYear: "2024/25",
        sectionName: "Child Care Spaces",
        lineName: "Infants",
        monthlyAmount: "100.0000",
      })
      const deletedChildCareSpacesFundingSubmissionLine = await fundingSubmissionLineFactory.create(
        {
          fiscalYear: "2024/25",
          sectionName: "Child Care Spaces",
          lineName: "Toddlers",
          monthlyAmount: "200.0000",
        }
      )
      const childCareSpaceLine = {
        submissionLineId: childCareSpacesFundingSubmissionLine.id,
        sectionName: "Child Care Spaces",
        lineName: "Infants",
        monthlyAmount: "100.0000",
        estimatedChildOccupancyRate: "0.5000",
        actualChildOccupancyRate: "0.2500",
        estimatedComputedTotal: "50.0000",
        actualComputedTotal: "25.0000",
      }
      const jsonOwnedLine = {
        submissionLineId: 3,
        sectionName: "Administration (10% of Spaces)",
        lineName: "Infants",
        monthlyAmount: "10.0000",
        estimatedChildOccupancyRate: "0.5000",
        actualChildOccupancyRate: "0.2500",
        estimatedComputedTotal: "5.0000",
        actualComputedTotal: "2.5000",
      }
      const fundingSubmissionLineJson = await fundingSubmissionLineJsonFactory
        .associations({ centre })
        .create({
          fiscalYear: "2024/25",
          dateName: FundingSubmissionLineJsonMonths.APRIL,
          dateStart: new Date("2024-04-01T00:00:00Z"),
          dateEnd: new Date("2024-04-30T23:59:59Z"),
          values: JSON.stringify([childCareSpaceLine, jsonOwnedLine]),
        })
      const conflictingCentre = await centreFactory.create()
      const existingChildCareSpace = await childCareSpaceFactory
        .associations({
          centre: conflictingCentre,
          fiscalPeriod,
          fundingSubmissionLine: childCareSpacesFundingSubmissionLine,
        })
        .create({
          monthlyAmount: "100.0000",
          estimatedChildOccupancyRate: "0.7500",
          actualChildOccupancyRate: "0.2500",
        })
      const conflictingFundingSubmissionLineJson = await fundingSubmissionLineJsonFactory
        .associations({ centre: conflictingCentre })
        .create({
          fiscalYear: "2024/25",
          dateName: FundingSubmissionLineJsonMonths.APRIL,
          dateStart: new Date("2024-04-01T00:00:00Z"),
          dateEnd: new Date("2024-04-30T23:59:59Z"),
          values: JSON.stringify([childCareSpaceLine]),
        })

      const deletedFundingSubmissionLineJson = await fundingSubmissionLineJsonFactory
        .associations({ centre })
        .create({
          fiscalYear: "2024/25",
          dateName: FundingSubmissionLineJsonMonths.APRIL,
          dateStart: new Date("2024-04-01T00:00:00Z"),
          dateEnd: new Date("2024-04-30T23:59:59Z"),
          values: JSON.stringify([
            {
              ...childCareSpaceLine,
              submissionLineId: deletedChildCareSpacesFundingSubmissionLine.id,
              lineName: "Toddlers",
              monthlyAmount: "200.0000",
            },
          ]),
        })
      await deletedFundingSubmissionLineJson.destroy()
      const unresolvedFundingSubmissionLineJson = await fundingSubmissionLineJsonFactory
        .associations({ centre })
        .create({
          fiscalYear: "2023/24",
          dateName: FundingSubmissionLineJsonMonths.APRIL,
          dateStart: new Date("2023-04-01T00:00:00Z"),
          dateEnd: new Date("2023-04-30T23:59:59Z"),
          values: JSON.stringify([childCareSpaceLine]),
        })

      const migration = { context: db.queryInterface } as Migration

      // Act
      await migrateChildCareSpaces(migration)
      await migrateChildCareSpaces(migration)

      // Assert
      const migratedChildCareSpace = await ChildCareSpace.findOne({
        where: {
          centreId: centre.id,
          fiscalPeriodId: fiscalPeriod.id,
          fundingSubmissionLineId: childCareSpacesFundingSubmissionLine.id,
        },
      })
      await existingChildCareSpace.reload()
      await conflictingFundingSubmissionLineJson.reload()
      await fundingSubmissionLineJson.reload()
      await unresolvedFundingSubmissionLineJson.reload()

      expect({
        childCareSpace: migratedChildCareSpace,
        childCareSpacesCount: await ChildCareSpace.count({
          where: {
            fiscalPeriodId: fiscalPeriod.id,
            fundingSubmissionLineId: childCareSpacesFundingSubmissionLine.id,
          },
        }),
        conflictingChildCareSpace: existingChildCareSpace,
        conflictingWorksheetLines: conflictingFundingSubmissionLineJson.lines,
        unresolvedWorksheetLines: unresolvedFundingSubmissionLineJson.lines,
        worksheetLines: fundingSubmissionLineJson.lines,
      }).toEqual({
        childCareSpace: expect.objectContaining({
          centreId: centre.id,
          fiscalPeriodId: fiscalPeriod.id,
          fundingSubmissionLineId: childCareSpacesFundingSubmissionLine.id,
          lineName: "Infants",
          monthlyAmount: "100",
          estimatedChildOccupancyRate: "0.5",
          actualChildOccupancyRate: "0.25",
          estimatedComputedTotal: "50",
          actualComputedTotal: "25",
        }),
        childCareSpacesCount: 2,
        conflictingChildCareSpace: expect.objectContaining({
          centreId: conflictingCentre.id,
          fiscalPeriodId: fiscalPeriod.id,
          fundingSubmissionLineId: childCareSpacesFundingSubmissionLine.id,
          estimatedChildOccupancyRate: "0.75",
          actualChildOccupancyRate: "0.25",
          estimatedComputedTotal: "75",
          actualComputedTotal: "25",
        }),
        conflictingWorksheetLines: [childCareSpaceLine],
        unresolvedWorksheetLines: [childCareSpaceLine],
        worksheetLines: [jsonOwnedLine],
      })
    })
  })
})
