import { ChildCareSpace } from "@/models"

import {
  centreFactory,
  childCareSpaceFactory,
  fiscalPeriodFactory,
  fundingPeriodFactory,
  fundingSubmissionLineFactory,
} from "@/factories"

describe("api/src/models/child-care-space.ts", () => {
  describe("ChildCareSpace", () => {
    describe("beforeSave", () => {
      test("when occupancy rates are saved, persists totals calculated from the monthly amount", async () => {
        // Arrange
        const childCareSpace = await childCareSpaceFactory.create({
          monthlyAmount: "19.9999",
          estimatedChildOccupancyRate: "0.0000",
          actualChildOccupancyRate: "0.0000",
        })

        // Act
        await childCareSpace.update({
          estimatedChildOccupancyRate: "0.3333",
          actualChildOccupancyRate: "0.1250",
        })

        // Assert
        await expect(childCareSpace.reload()).resolves.toEqual(
          expect.objectContaining({
            estimatedComputedTotal: "6.666",
            actualComputedTotal: "2.5",
          })
        )
      })
    })

    describe(".withScopes", () => {
      describe(".byFiscalYear scope", () => {
        test("when child care spaces span fiscal years, returns only the requested fiscal year", async () => {
          // Arrange
          const centre = await centreFactory.create()
          const matchingFundingPeriod = await fundingPeriodFactory.create({
            fiscalYear: "2024-2025",
          })
          const matchingFiscalPeriod = await fiscalPeriodFactory.create({
            fundingPeriodId: matchingFundingPeriod.id,
            fiscalYear: "2024-25",
          })
          const otherFundingPeriod = await fundingPeriodFactory.create({
            fiscalYear: "2025-2026",
          })
          const otherFiscalPeriod = await fiscalPeriodFactory.create({
            fundingPeriodId: otherFundingPeriod.id,
            fiscalYear: "2025-26",
          })
          const fundingSubmissionLine = await fundingSubmissionLineFactory.create()
          const matchingChildCareSpace = await childCareSpaceFactory
            .associations({
              centre,
              fiscalPeriod: matchingFiscalPeriod,
              fundingSubmissionLine,
            })
            .create()
          await childCareSpaceFactory
            .associations({
              centre,
              fiscalPeriod: otherFiscalPeriod,
              fundingSubmissionLine,
            })
            .create()

          // Act
          const childCareSpaces = await ChildCareSpace.withScope({
            method: ["byFiscalYear", "2024-25"],
          }).findAll()

          // Assert
          expect(childCareSpaces).toEqual([
            expect.objectContaining({
              id: matchingChildCareSpace.id,
              centreId: centre.id,
              fiscalPeriodId: matchingFiscalPeriod.id,
            }),
          ])
        })
      })
    })
  })
})
