import { ValidationError } from "@sequelize/core"

import { FundingSubmissionLine } from "@/models"

import { childCareSpaceCategoryFactory, fundingPeriodFactory } from "@/factories"

import CreateService from "@/services/funding-submission-lines/create-service"

describe("api/src/services/funding-submission-lines/create-service.ts", () => {
  describe("CreateService", () => {
    describe("#perform", () => {
      test("when creating an unrelated section without a category link, persists its snapshot without a ledger link", async () => {
        // Arrange
        await fundingPeriodFactory.create({ fiscalYear: "2147-2148" })

        // Act
        const fundingSubmissionLine = await CreateService.perform({
          fiscalYear: "2147/48",
          sectionName: "Additional Funding",
          lineName: "Infants",
          monthlyAmount: "100.00",
          childCareSpaceCategoryId: null,
        })

        // Assert
        const persistedLines = await FundingSubmissionLine.findAll()
        expect(persistedLines).toEqual([
          expect.objectContaining({
            id: fundingSubmissionLine.id,
            fiscalYear: "2147/48",
            sectionName: "Additional Funding",
            lineName: "Infants",
            monthlyAmount: "100",
            childCareSpaceCategoryId: null,
          }),
        ])
      })

      test("when creating an unrelated section with a category link, persists its snapshot without the ledger link", async () => {
        // Arrange
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2147-2148" })
        const category = await childCareSpaceCategoryFactory.create({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "Infants",
        })

        // Act
        const fundingSubmissionLine = await CreateService.perform({
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
            id: fundingSubmissionLine.id,
            fiscalYear: "2147/48",
            sectionName: "Other Section",
            lineName: "Infants",
            monthlyAmount: "300",
            childCareSpaceCategoryId: null,
          }),
        ])
      })

      test.each([
        "Child Care Spaces",
        "Children with Diverse Needs",
        "Administration",
        "Administration (10% of Spaces)",
        "Quality Enhancement Program",
      ])("when creating retired %s, rejects the configuration", async (sectionName) => {
        // Arrange
        const attributes = {
          fiscalYear: "2025/26",
          sectionName,
          lineName: "Infants",
          monthlyAmount: "100.00",
        }

        // Act
        const createPromise = CreateService.perform(attributes)

        // Assert
        await expect(createPromise).rejects.toThrow(ValidationError)
      })
    })
  })
})
