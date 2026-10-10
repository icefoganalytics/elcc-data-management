import {
  childCareSpaceCategoryFactory,
  fundingPeriodFactory,
  fundingSubmissionLineFactory,
} from "@/factories"
import UpdateService from "@/services/funding-submission-lines/update-service"

describe("api/src/services/funding-submission-lines/update-service.ts", () => {
  describe("UpdateService", () => {
    describe("#perform", () => {
      test("when linked configuration is renamed and moved, preserves identity within its period and remaps or clears it across boundaries", async () => {
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
          lineName: "Infants",
          monthlyAmount: "100.00",
          childCareSpaceCategoryId: category1.id,
        })

        // Act
        await UpdateService.perform(line, {
          lineName: "Young Children",
          childCareSpaceCategoryId: category2.id,
        })
        await line.reload()
        const categoryIdAfterRename = line.childCareSpaceCategoryId

        await UpdateService.perform(line, { fiscalYear: "2025/26" })
        await line.reload()
        const categoryIdAfterPeriodChange = line.childCareSpaceCategoryId

        await UpdateService.perform(line, { sectionName: "Other Section" })
        await line.reload()
        const categoryIdAfterSectionChange = line.childCareSpaceCategoryId

        // Assert
        expect({
          categoryIdAfterRename,
          categoryIdAfterPeriodChange,
          categoryIdAfterSectionChange,
        }).toEqual({
          categoryIdAfterRename: category1.id,
          categoryIdAfterPeriodChange: category2.id,
          categoryIdAfterSectionChange: null,
        })
      })
    })
  })
})
