import { ChildrenWithDiverseNeedsFundingCategory } from "@/models"

import {
  childrenWithDiverseNeedsFundingCategoryFactory,
  childrenWithDiverseNeedsFundingRecordFactory,
  fiscalPeriodFactory,
} from "@/factories"

import DestroyService from "@/services/children-with-diverse-needs-funding-categories/destroy-service"

describe("api/src/services/children-with-diverse-needs-funding-categories/destroy-service.ts", () => {
  describe("DestroyService", () => {
    describe("#perform", () => {
      test("when a category has active monthly records, rejects retirement", async () => {
        // Arrange
        const category = await childrenWithDiverseNeedsFundingCategoryFactory.create()
        const fiscalPeriod = await fiscalPeriodFactory.create({
          fundingPeriodId: category.fundingPeriodId,
        })
        await childrenWithDiverseNeedsFundingRecordFactory
          .associations({
            category,
            fiscalPeriod,
          })
          .create()

        // Act
        const retirementPromise = DestroyService.perform(category)

        // Assert
        await expect(retirementPromise).rejects.toThrow(
          "Cannot delete a category used by Children with Diverse Needs funding records"
        )
      })

      test("when only another category has active records, retires the unused category", async () => {
        // Arrange
        const category = await childrenWithDiverseNeedsFundingCategoryFactory.create()
        await childrenWithDiverseNeedsFundingRecordFactory.create()

        // Act
        await DestroyService.perform(category)

        // Assert
        const retiredCategory = await ChildrenWithDiverseNeedsFundingCategory.findByPk(category.id)
        expect(retiredCategory).toBeNull()
      })

      test("when all records using a category have been deleted, allows retirement", async () => {
        // Arrange
        const category = await childrenWithDiverseNeedsFundingCategoryFactory.create()
        const fiscalPeriod = await fiscalPeriodFactory.create({
          fundingPeriodId: category.fundingPeriodId,
        })
        const fundingRecord = await childrenWithDiverseNeedsFundingRecordFactory
          .associations({
            category,
            fiscalPeriod,
          })
          .create()
        await fundingRecord.destroy()

        // Act
        await DestroyService.perform(category)

        // Assert
        const retiredCategory = await ChildrenWithDiverseNeedsFundingCategory.findByPk(category.id)
        expect(retiredCategory).toBeNull()
      })
    })
  })
})
