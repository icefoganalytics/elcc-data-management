import ChildrenWithDiverseNeedsFundingCategory from "@/models/children-with-diverse-needs-funding-category"

import { fundingPeriodFactory } from "@/factories"
import { CreateService } from "@/services/children-with-diverse-needs-funding-categories/create-service"

describe("api/src/services/children-with-diverse-needs-funding-categories/create-service.ts", () => {
  describe("CreateService", () => {
    describe("#perform", () => {
      test("when age bounds are omitted, persists null bounds", async () => {
        // Arrange
        const fundingPeriod = await fundingPeriodFactory.create()

        // Act
        const category = await CreateService.perform({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "Infants Diverse Need",
          monthlyAmount: "54.9600",
        })

        // Assert
        const persistedCategory = await ChildrenWithDiverseNeedsFundingCategory.findByPk(
          category.id
        )
        expect(persistedCategory).toMatchObject({ fromAge: null, toAge: null })
      })

      test("when age bounds are null, preserves null bounds", async () => {
        // Arrange
        const fundingPeriod = await fundingPeriodFactory.create()

        // Act
        const category = await CreateService.perform({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "Toddlers Diverse Need",
          fromAge: null,
          toAge: null,
          monthlyAmount: "54.9600",
        })

        // Assert
        const persistedCategory = await ChildrenWithDiverseNeedsFundingCategory.findByPk(
          category.id
        )
        expect(persistedCategory).toMatchObject({ fromAge: null, toAge: null })
      })

      test("when a required field is omitted, rejects the incomplete input", async () => {
        // Arrange
        const fundingPeriod = await fundingPeriodFactory.create()
        const attributes = {
          fundingPeriodId: fundingPeriod.id,
          categoryName: "School-age Diverse Need",
          monthlyAmount: "54.9600",
        }

        // Act / Assert
        await expect(
          CreateService.perform({ ...attributes, fundingPeriodId: undefined })
        ).rejects.toThrow("Funding period ID is required")
      })
    })
  })
})
