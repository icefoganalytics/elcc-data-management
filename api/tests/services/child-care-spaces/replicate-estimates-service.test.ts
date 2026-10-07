import {
  centreFactory,
  fiscalPeriodFactory,
  fundingPeriodFactory,
  fundingSubmissionLineFactory,
} from "@/factories"
import { childCareSpaceFactory } from "@/factories/child-care-space-factory"

import ReplicateEstimatesService from "@/services/child-care-spaces/replicate-estimates-service"

describe("api/src/services/child-care-spaces/replicate-estimates-service.ts", () => {
  describe("ReplicateEstimatesService", () => {
    describe("#perform", () => {
      test("when later fiscal periods have matching Child Care Spaces rows, copies estimates and resets actuals", async () => {
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
        const fundingSubmissionLine = await fundingSubmissionLineFactory.create({
          fiscalYear: "2024/25",
          sectionName: "Child Care Spaces",
        })
        const sourceChildCareSpace = await childCareSpaceFactory
          .associations({
            centre,
            fiscalPeriod: aprilFiscalPeriod,
            fundingSubmissionLine,
          })
          .create({
            monthlyAmount: "100.0000",
            estimatedChildOccupancyRate: "0.8000",
            actualChildOccupancyRate: "0.7500",
          })
        const laterChildCareSpace = await childCareSpaceFactory
          .associations({
            centre,
            fiscalPeriod: mayFiscalPeriod,
            fundingSubmissionLine,
          })
          .create({
            monthlyAmount: "100.0000",
            estimatedChildOccupancyRate: "0.1000",
            actualChildOccupancyRate: "0.5000",
          })

        // Act
        await ReplicateEstimatesService.perform(sourceChildCareSpace)

        // Assert
        await expect(laterChildCareSpace.reload()).resolves.toEqual(
          expect.objectContaining({
            estimatedChildOccupancyRate: "0.8",
            actualChildOccupancyRate: "0",
            estimatedComputedTotal: "80",
            actualComputedTotal: "0",
          })
        )
      })
    })
  })
})
