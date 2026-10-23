import { ChildCareSpace, QualityEnhancement } from "@/models"

import {
  centreFactory,
  childCareSpaceCategoryFactory,
  childCareSpaceFactory,
  fiscalPeriodFactory,
  fundingPeriodFactory,
  qualityEnhancementCategoryFactory,
  qualityEnhancementFactory,
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
        const selectedCategory = await childCareSpaceCategoryFactory.create({
          fundingPeriodId: selectedFundingPeriod.id,
          categoryName: "Selected",
        })
        const unrelatedCategory = await childCareSpaceCategoryFactory.create({
          fundingPeriodId: unrelatedFundingPeriod.id,
          categoryName: "Unrelated",
        })
        await childCareSpaceFactory
          .associations({
            centre,
            fiscalPeriod: selectedFiscalPeriod,
            category: selectedCategory,
          })
          .create()
        const unrelatedChildCareSpace = await childCareSpaceFactory
          .associations({
            centre,
            fiscalPeriod: unrelatedFiscalPeriod,
            category: unrelatedCategory,
          })
          .create()

        // Act
        await DestroyService.perform(selectedFundingPeriod)

        // Act
        const remainingChildCareSpaces = await ChildCareSpace.findAll()

        // Assert
        expect(remainingChildCareSpaces).toEqual([
          expect.objectContaining({
            id: unrelatedChildCareSpace.id,
            deletedAt: null,
          }),
        ])
      })

      test("when deleting a funding period, preserves Quality Enhancements from another period", async () => {
        // Arrange
        const centre = await centreFactory.create()
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2026-2027" })
        const otherFundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2027-2028" })
        const fiscalPeriod = await fiscalPeriodFactory.create({
          fundingPeriodId: fundingPeriod.id,
          fiscalYear: "2026-27",
        })
        const otherFiscalPeriod = await fiscalPeriodFactory.create({
          fundingPeriodId: otherFundingPeriod.id,
          fiscalYear: "2027-28",
        })
        const category = await qualityEnhancementCategoryFactory.create({
          fundingPeriodId: fundingPeriod.id,
        })
        const otherCategory = await qualityEnhancementCategoryFactory.create({
          fundingPeriodId: otherFundingPeriod.id,
        })
        await qualityEnhancementFactory.associations({ centre, category, fiscalPeriod }).create()
        const otherQualityEnhancement = await qualityEnhancementFactory
          .associations({
            centre,
            category: otherCategory,
            fiscalPeriod: otherFiscalPeriod,
          })
          .create()

        // Act
        await DestroyService.perform(fundingPeriod)

        // Assert
        const qualityEnhancements = await QualityEnhancement.findAll()
        expect(qualityEnhancements).toEqual([
          expect.objectContaining({
            id: otherQualityEnhancement.id,
            fiscalPeriodId: otherFiscalPeriod.id,
          }),
        ])
      })
    })
  })
})
