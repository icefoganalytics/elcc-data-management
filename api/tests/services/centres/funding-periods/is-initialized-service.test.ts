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

      test("when a Child Care Spaces funding submission line is soft-deleted, its historical pair is retained as complete", async () => {
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
        })
        const toddlersFundingSubmissionLine = await fundingSubmissionLineFactory.create({
          fiscalYear: "2024/25",
          sectionName: "Child Care Spaces",
          lineName: "Toddlers",
        })
        await childCareSpaceFactory
          .associations({
            centre,
            fiscalPeriod,
            fundingSubmissionLine: infantsFundingSubmissionLine,
          })
          .create()
        await childCareSpaceFactory
          .associations({
            centre,
            fiscalPeriod,
            fundingSubmissionLine: toddlersFundingSubmissionLine,
          })
          .create()
        await toddlersFundingSubmissionLine.destroy()

        // Act
        const initializationStatus = await IsInitializedService.perform(centre, fundingPeriod)

        // Assert
        expect(initializationStatus).toMatchObject({ hasChildCareSpaces: true })
      })

      test("when all Child Care Spaces funding submission lines are soft-deleted, the empty expected set is complete", async () => {
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
        const initializationStatus = await IsInitializedService.perform(centre, fundingPeriod)

        // Assert
        expect(initializationStatus).toMatchObject({ hasChildCareSpaces: true })
      })
    })
  })
})
