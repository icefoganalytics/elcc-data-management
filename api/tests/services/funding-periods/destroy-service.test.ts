import { ChildCareSpace } from "@/models"

import {
  centreFactory,
  childCareSpaceFactory,
  fiscalPeriodFactory,
  fundingPeriodFactory,
  fundingSubmissionLineFactory,
} from "@/factories"

import { DestroyService } from "@/services/funding-periods/destroy-service"

describe("api/src/services/funding-periods/destroy-service.ts", () => {
  describe("DestroyService", () => {
    describe("#perform", () => {
      test("when deleting a funding period, preserves child care spaces from other periods", async () => {
        // Arrange
        const centre = await centreFactory.create()
        const selectedFundingPeriod = await fundingPeriodFactory.create({
          fiscalYear: "2024-2025",
        })
        const unrelatedFundingPeriod = await fundingPeriodFactory.create({
          fiscalYear: "2025-2026",
        })
        const selectedFiscalPeriod = await fiscalPeriodFactory.create({
          fundingPeriodId: selectedFundingPeriod.id,
          fiscalYear: "2024-25",
        })
        const unrelatedFiscalPeriod = await fiscalPeriodFactory.create({
          fundingPeriodId: unrelatedFundingPeriod.id,
          fiscalYear: "2025-26",
        })
        const selectedFundingSubmissionLine = await fundingSubmissionLineFactory.create({
          fiscalYear: "2024/25",
          sectionName: "Child Care Spaces",
        })
        const unrelatedFundingSubmissionLine = await fundingSubmissionLineFactory.create({
          fiscalYear: "2025/26",
          sectionName: "Child Care Spaces",
        })
        const selectedChildCareSpace = await childCareSpaceFactory
          .associations({
            centre,
            fiscalPeriod: selectedFiscalPeriod,
            fundingSubmissionLine: selectedFundingSubmissionLine,
          })
          .create()
        const unrelatedChildCareSpace = await childCareSpaceFactory
          .associations({
            centre,
            fiscalPeriod: unrelatedFiscalPeriod,
            fundingSubmissionLine: unrelatedFundingSubmissionLine,
          })
          .create()

        // Act
        await DestroyService.perform(selectedFundingPeriod)

        // Assert
        const selectedRow = await ChildCareSpace.findByPk(selectedChildCareSpace.id)
        const unrelatedRow = await ChildCareSpace.findByPk(unrelatedChildCareSpace.id)
        expect({ selectedRow, unrelatedRow }).toEqual({
          selectedRow: null,
          unrelatedRow: expect.objectContaining({
            id: unrelatedChildCareSpace.id,
            deletedAt: null,
          }),
        })
      })
    })
  })
})
