import {
  centreFactory,
  fiscalPeriodFactory,
  fundingPeriodFactory,
  fundingSubmissionLineFactory,
} from "@/factories"
import { childCareSpaceFactory } from "@/factories/child-care-space-factory"
import { ChildCareSpace } from "@/models"

import BulkCreateService from "@/services/centres/funding-periods/child-care-spaces/bulk-create-service"

describe("api/src/services/centres/funding-periods/child-care-spaces/bulk-create-service.ts", () => {
  describe("BulkCreateService", () => {
    describe("#perform", () => {
      test("when one Child Care Spaces pair already exists, creates only the missing fiscal-period and submission-line pairs", async () => {
        // Arrange
        const centre = await centreFactory.create()
        const fundingPeriod = await fundingPeriodFactory.create({
          fiscalYear: "2024-2025",
        })
        const aprilFiscalPeriod = await fiscalPeriodFactory.create({
          fundingPeriodId: fundingPeriod.id,
          fiscalYear: "2024-25",
          dateStart: new Date("2024-04-01"),
        })
        const mayFiscalPeriod = await fiscalPeriodFactory.create({
          fundingPeriodId: fundingPeriod.id,
          fiscalYear: "2024-25",
          dateStart: new Date("2024-05-01"),
        })
        const infantsFundingSubmissionLine = await fundingSubmissionLineFactory.create({
          fiscalYear: "2024/25",
          sectionName: "Child Care Spaces",
          lineName: "Infants",
          monthlyAmount: "100.0000",
        })
        const toddlersFundingSubmissionLine = await fundingSubmissionLineFactory.create({
          fiscalYear: "2024/25",
          sectionName: "Child Care Spaces",
          lineName: "Toddlers",
          monthlyAmount: "200.0000",
        })
        await childCareSpaceFactory
          .associations({
            centre,
            fiscalPeriod: aprilFiscalPeriod,
            fundingSubmissionLine: infantsFundingSubmissionLine,
          })
          .create()

        // Act
        const childCareSpaces = await BulkCreateService.perform(centre, fundingPeriod)

        // Assert
        expect(childCareSpaces).toEqual([
          expect.objectContaining({
            centreId: centre.id,
            fiscalPeriodId: aprilFiscalPeriod.id,
            fundingSubmissionLineId: toddlersFundingSubmissionLine.id,
            lineName: "Toddlers",
            monthlyAmount: "200",
            estimatedChildOccupancyRate: "0",
            actualChildOccupancyRate: "0",
          }),
          expect.objectContaining({
            centreId: centre.id,
            fiscalPeriodId: mayFiscalPeriod.id,
            fundingSubmissionLineId: infantsFundingSubmissionLine.id,
            lineName: "Infants",
            monthlyAmount: "100",
            estimatedChildOccupancyRate: "0",
            actualChildOccupancyRate: "0",
          }),
          expect.objectContaining({
            centreId: centre.id,
            fiscalPeriodId: mayFiscalPeriod.id,
            fundingSubmissionLineId: toddlersFundingSubmissionLine.id,
            lineName: "Toddlers",
            monthlyAmount: "200",
            estimatedChildOccupancyRate: "0",
            actualChildOccupancyRate: "0",
          }),
        ])
      })

      test("when a Child Care Spaces funding submission line is soft-deleted, provisioning preserves historical snapshots", async () => {
        // Arrange
        const centre = await centreFactory.create()
        const fundingPeriod = await fundingPeriodFactory.create({
          fiscalYear: "2024-2025",
        })
        const fiscalPeriod = await fiscalPeriodFactory.create({
          fundingPeriodId: fundingPeriod.id,
          fiscalYear: "2024-25",
          dateStart: new Date("2024-04-01"),
        })
        const infantsFundingSubmissionLine = await fundingSubmissionLineFactory.create({
          fiscalYear: "2024/25",
          sectionName: "Child Care Spaces",
          lineName: "Infants",
          monthlyAmount: "100.0000",
        })
        const toddlersFundingSubmissionLine = await fundingSubmissionLineFactory.create({
          fiscalYear: "2024/25",
          sectionName: "Child Care Spaces",
          lineName: "Toddlers",
          monthlyAmount: "200.0000",
        })
        await childCareSpaceFactory
          .associations({
            centre,
            fiscalPeriod,
            fundingSubmissionLine: infantsFundingSubmissionLine,
          })
          .create({
            lineName: "Historical Infants",
            monthlyAmount: "150.0000",
            estimatedChildOccupancyRate: "0.7500",
            actualChildOccupancyRate: "0.6000",
          })
        await childCareSpaceFactory
          .associations({
            centre,
            fiscalPeriod,
            fundingSubmissionLine: toddlersFundingSubmissionLine,
          })
          .create({
            lineName: "Historical Toddlers",
            monthlyAmount: "250.0000",
            estimatedChildOccupancyRate: "0.8500",
            actualChildOccupancyRate: "0.7000",
          })
        const childCareSpacesBefore = await ChildCareSpace.withScope({
          method: ["byFundingPeriod", fundingPeriod.id],
        }).findAll({
          where: {
            centreId: centre.id,
          },
          order: [["id", "ASC"]],
        })
        const historicalSnapshots = childCareSpacesBefore.map(
          ({
            id,
            fundingSubmissionLineId,
            lineName,
            monthlyAmount,
            estimatedChildOccupancyRate,
            actualChildOccupancyRate,
          }) => ({
            id,
            fundingSubmissionLineId,
            lineName,
            monthlyAmount,
            estimatedChildOccupancyRate,
            actualChildOccupancyRate,
          })
        )
        await toddlersFundingSubmissionLine.destroy()

        // Act
        const createdChildCareSpaces = await BulkCreateService.perform(centre, fundingPeriod)
        const childCareSpacesAfter = await ChildCareSpace.withScope({
          method: ["byFundingPeriod", fundingPeriod.id],
        }).findAll({
          where: {
            centreId: centre.id,
          },
          order: [["id", "ASC"]],
        })
        const snapshotsAfter = childCareSpacesAfter.map(
          ({
            id,
            fundingSubmissionLineId,
            lineName,
            monthlyAmount,
            estimatedChildOccupancyRate,
            actualChildOccupancyRate,
          }) => ({
            id,
            fundingSubmissionLineId,
            lineName,
            monthlyAmount,
            estimatedChildOccupancyRate,
            actualChildOccupancyRate,
          })
        )

        // Assert
        expect({ createdChildCareSpaces, snapshotsAfter }).toEqual({
          createdChildCareSpaces: [],
          snapshotsAfter: historicalSnapshots,
        })
      })

      test("when all Child Care Spaces funding submission lines are soft-deleted, provisioning returns no new spaces", async () => {
        // Arrange
        const centre = await centreFactory.create()
        const fundingPeriod = await fundingPeriodFactory.create({
          fiscalYear: "2024-2025",
        })
        await fiscalPeriodFactory.create({
          fundingPeriodId: fundingPeriod.id,
          fiscalYear: "2024-25",
          dateStart: new Date("2024-04-01"),
        })
        const infantsFundingSubmissionLine = await fundingSubmissionLineFactory.create({
          fiscalYear: "2024/25",
          sectionName: "Child Care Spaces",
          lineName: "Infants",
        })
        const toddlersFundingSubmissionLine = await fundingSubmissionLineFactory.create({
          fiscalYear: "2024/25",
          sectionName: "Child Care Spaces",
          lineName: "Toddlers",
        })
        await infantsFundingSubmissionLine.destroy()
        await toddlersFundingSubmissionLine.destroy()

        // Act
        const childCareSpaces = await BulkCreateService.perform(centre, fundingPeriod)

        // Assert
        expect(childCareSpaces).toEqual([])
      })
    })
  })
})
