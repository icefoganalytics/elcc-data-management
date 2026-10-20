import {
  childCareSpaceCategoryFactory,
  fundingPeriodFactory,
  fundingSubmissionLineFactory,
} from "@/factories"
import UpdateService from "@/services/funding-submission-lines/update-service"

describe("api/src/services/funding-submission-lines/update-service.ts", () => {
  describe("UpdateService", () => {
    describe("#perform", () => {
      test("when a linked line is renamed with another category ID, preserves its original category", async () => {
        // Arrange
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2024-2025" })
        const category = await childCareSpaceCategoryFactory.create({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "Babies",
        })
        const replacementCategory = await childCareSpaceCategoryFactory.create({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "Toddlers",
        })
        const line = await fundingSubmissionLineFactory.create({
          fiscalYear: "2024/25",
          sectionName: "Administration (10% of Spaces)",
          lineName: "Infants",
          monthlyAmount: "100.00",
          childCareSpaceCategoryId: category.id,
        })

        // Act
        await UpdateService.perform(line, {
          lineName: "Young Children",
          childCareSpaceCategoryId: replacementCategory.id,
        })

        // Assert
        await line.reload()
        expect(line.childCareSpaceCategoryId).toBe(category.id)
      })

      test("when a linked line changes funding period, maps to that period's matching configuration", async () => {
        // Arrange
        const fundingPeriod1 = await fundingPeriodFactory.create({ fiscalYear: "2024-2025" })
        const category1 = await childCareSpaceCategoryFactory.create({
          fundingPeriodId: fundingPeriod1.id,
          categoryName: "Babies",
        })
        const fundingPeriod2 = await fundingPeriodFactory.create({ fiscalYear: "2025-2026" })
        const category2 = await childCareSpaceCategoryFactory.create({
          fundingPeriodId: fundingPeriod2.id,
          categoryName: "Babies",
        })
        const line = await fundingSubmissionLineFactory.create({
          fiscalYear: "2024/25",
          sectionName: "Administration (10% of Spaces)",
          lineName: "Young Children",
          monthlyAmount: "100.00",
          childCareSpaceCategoryId: category1.id,
        })

        // Act
        await UpdateService.perform(line, { fiscalYear: "2025/26" })

        // Assert
        await line.reload()
        expect(line.childCareSpaceCategoryId).toBe(category2.id)
      })

      test("when a linked line changes section, clears its category link", async () => {
        // Arrange
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2024-2025" })
        const category = await childCareSpaceCategoryFactory.create({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "Babies",
        })
        const line = await fundingSubmissionLineFactory.create({
          fiscalYear: "2024/25",
          sectionName: "Administration (10% of Spaces)",
          lineName: "Infants",
          monthlyAmount: "100.00",
          childCareSpaceCategoryId: category.id,
        })

        // Act
        await UpdateService.perform(line, { sectionName: "Other Section" })

        // Assert
        await line.reload()
        expect(line.childCareSpaceCategoryId).toBeNull()
      })

      test("when an ordinary line changes to the retired Child Care Spaces section, rejects the update", async () => {
        // Arrange
        const line = await fundingSubmissionLineFactory.create({
          fiscalYear: "2024/25",
          sectionName: "Other Section",
          lineName: "Infants",
          monthlyAmount: "100.00",
        })

        // Act
        const updatePromise = UpdateService.perform(line, {
          sectionName: "Child Care Spaces",
        })

        // Assert
        await expect(updatePromise).rejects.toThrow(
          "Child Care Spaces configuration must use the Child Care Spaces ledger."
        )
      })
    })
  })
})
