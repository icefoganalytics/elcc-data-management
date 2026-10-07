import {
  centreFactory,
  fiscalPeriodFactory,
  fundingPeriodFactory,
  fundingSubmissionLineFactory,
} from "@/factories"
import { childCareSpaceFactory } from "@/factories/child-care-space-factory"

import IsInitializedService from "@/services/centres/funding-periods/is-initialized-service"

describe("api/src/services/centres/funding-periods/is-initialized-service.ts", () => {
  describe("IsInitializedService", () => {
    describe("#perform", () => {
      test("when only some Child Care Spaces fiscal-period and submission-line pairs exist, reports Child Care Spaces as uninitialized", async () => {
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
        await fiscalPeriodFactory.create({
          fundingPeriodId: fundingPeriod.id,
          fiscalYear: "2024-25",
          dateStart: new Date("2024-05-01"),
        })
        const infantsFundingSubmissionLine = await fundingSubmissionLineFactory.create({
          fiscalYear: "2024/25",
          sectionName: "Child Care Spaces",
          lineName: "Infants",
        })
        await fundingSubmissionLineFactory.create({
          fiscalYear: "2024/25",
          sectionName: "Child Care Spaces",
          lineName: "Toddlers",
        })
        await childCareSpaceFactory
          .associations({
            centre,
            fiscalPeriod: aprilFiscalPeriod,
            fundingSubmissionLine: infantsFundingSubmissionLine,
          })
          .create()

        // Act
        const initializationStatus = await IsInitializedService.perform(centre, fundingPeriod)

        // Assert
        expect(initializationStatus.hasChildCareSpaces).toBe(false)
      })
    })
  })
})
