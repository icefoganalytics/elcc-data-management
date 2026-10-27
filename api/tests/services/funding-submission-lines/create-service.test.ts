import { childCareSpaceCategoryFactory, fundingPeriodFactory } from "@/factories"
import { FundingSubmissionLine } from "@/models"
import CreateService from "@/services/funding-submission-lines/create-service"

describe("api/src/services/funding-submission-lines/create-service.ts", () => {
  describe("CreateService", () => {
    describe("#perform", () => {
      test("when creating dependent and unrelated sections, links only dependent sections to their period's category", async () => {
        // Arrange
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2147-2148" })
        const category = await childCareSpaceCategoryFactory.create({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "Infants",
        })

        // Act
        await CreateService.perform({
          fiscalYear: "2147/48",
          sectionName: "Administration (10% of Spaces)",
          lineName: "Infants",
          monthlyAmount: "100.00",
          childCareSpaceCategoryId: null,
        })
        await CreateService.perform({
          fiscalYear: "2147/48",
          sectionName: "Other Section",
          lineName: "Infants",
          monthlyAmount: "300.00",
          childCareSpaceCategoryId: category.id,
        })

        // Assert
        const persistedLines = await FundingSubmissionLine.findAll()
        expect(persistedLines).toEqual([
          expect.objectContaining({
            sectionName: "Administration (10% of Spaces)",
            childCareSpaceCategoryId: category.id,
          }),
          expect.objectContaining({
            sectionName: "Other Section",
            childCareSpaceCategoryId: null,
          }),
        ])
      })

      test("when creating a retired Child Care Spaces section, rejects the configuration", async () => {
        // Arrange
        const attributes = {
          fiscalYear: "2025/26",
          sectionName: "Child Care Spaces",
          lineName: "Infants",
          monthlyAmount: "100.00",
        }

        // Act
        const createPromise = CreateService.perform(attributes)

        // Assert
        await expect(createPromise).rejects.toThrow(
          "Child Care Spaces configuration must use the Child Care Spaces ledger."
        )
      })
    })
  })
})
