import { ChildCareCategory } from "@/models"
import {
  childCareCategoryFactory,
  childCareSpaceCategoryFactory,
  administrationCostCategoryFactory,
  qualityEnhancementCategoryFactory,
} from "@/factories"
import DestroyService from "@/services/child-care-categories/destroy-service"

describe("api/src/services/child-care-categories/destroy-service.ts", () => {
  describe("DestroyService", () => {
    describe("#perform", () => {
      test("when child-care-space is configured, rejects retirement", async () => {
        // Arrange
        const childCareCategory = await childCareCategoryFactory.create()
        await childCareSpaceCategoryFactory.create({
          fundingPeriodId: childCareCategory.fundingPeriodId,
          childCareCategoryId: childCareCategory.id,
        })

        // Act
        const retirement = DestroyService.perform(childCareCategory)

        // Assert
        await expect(retirement).rejects.toThrow(
          "Cannot delete a Child Care category with active program configurations"
        )
      })

      test("when administration-cost is configured, rejects retirement", async () => {
        // Arrange
        const childCareCategory = await childCareCategoryFactory.create()
        await administrationCostCategoryFactory.create({
          fundingPeriodId: childCareCategory.fundingPeriodId,
          childCareCategoryId: childCareCategory.id,
        })

        // Act
        const retirement = DestroyService.perform(childCareCategory)

        // Assert
        await expect(retirement).rejects.toThrow(
          "Cannot delete a Child Care category with active program configurations"
        )
      })

      test("when quality-enhancement is configured, rejects retirement", async () => {
        // Arrange
        const childCareCategory = await childCareCategoryFactory.create()
        await qualityEnhancementCategoryFactory.create({
          fundingPeriodId: childCareCategory.fundingPeriodId,
          childCareCategoryId: childCareCategory.id,
        })

        // Act
        const retirement = DestroyService.perform(childCareCategory)

        // Assert
        await expect(retirement).rejects.toThrow(
          "Cannot delete a Child Care category with active program configurations"
        )
      })

      test("when a shared category is unconfigured, retires it", async () => {
        // Arrange
        const childCareCategory = await childCareCategoryFactory.create()

        // Act
        await DestroyService.perform(childCareCategory)

        // Assert
        const activeCategory = await ChildCareCategory.findByPk(childCareCategory.id)

        expect(activeCategory).toBeNull()
      })
    })
  })
})
