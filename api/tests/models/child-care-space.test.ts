import { ChildCareSpace } from "@/models"

import {
  centreFactory,
  childCareSpaceCategoryFactory,
  childCareSpaceFactory,
  fiscalPeriodFactory,
  fundingPeriodFactory,
} from "@/factories"

describe("api/src/models/child-care-space.ts", () => {
  describe("ChildCareSpace", () => {
    describe("beforeSave", () => {
      test("when occupancy rates are saved, persists totals calculated from the monthly amount", async () => {
        // Arrange
        const childCareSpace = await childCareSpaceFactory.create({
          monthlyAmount: "19.9999",
          estimatedChildOccupancyRate: "0.0000",
          actualChildOccupancyRate: "0.0000",
        })

        // Act
        await childCareSpace.update({
          estimatedChildOccupancyRate: "0.3333",
          actualChildOccupancyRate: "0.1250",
        })
        await childCareSpace.reload()

        // Assert
        expect(childCareSpace).toEqual(
          expect.objectContaining({
            estimatedComputedTotal: "6.666",
            actualComputedTotal: "2.5",
          })
        )
      })

      test.each([
        { estimatedChildOccupancyRate: "0.12345" },
        { actualChildOccupancyRate: "0.12345" },
      ])(
        "when an occupancy input exceeds storage precision, rejects the update: %o",
        async (attributes) => {
          // Arrange
          const childCareSpace = await childCareSpaceFactory.create({
            monthlyAmount: "100.0000",
            estimatedChildOccupancyRate: "0.2500",
            actualChildOccupancyRate: "0.5000",
          })

          // Act
          const updatePromise = childCareSpace.update(attributes)

          // Assert
          await expect(updatePromise).rejects.toThrow()
        }
      )

      test("when an occupancy input exceeds storage precision, preserves previously persisted money", async () => {
        // Arrange
        const childCareSpace = await childCareSpaceFactory.create({
          monthlyAmount: "100.0000",
          estimatedChildOccupancyRate: "0.2500",
          actualChildOccupancyRate: "0.5000",
        })

        // Act
        const invalidUpdate = childCareSpace.update({ estimatedChildOccupancyRate: "0.12345" })
        await invalidUpdate.catch(() => undefined)
        await childCareSpace.reload()

        // Assert
        expect(childCareSpace).toEqual(
          expect.objectContaining({
            estimatedChildOccupancyRate: "0.25",
            actualChildOccupancyRate: "0.5",
            estimatedComputedTotal: "25",
            actualComputedTotal: "50",
          })
        )
      })
    })

    describe(".withScopes", () => {
      describe(".byFiscalYear scope", () => {
        test("when child care spaces span fiscal years, returns only the requested fiscal year", async () => {
          // Arrange
          const centre = await centreFactory.create()
          const matchingFundingPeriod = await fundingPeriodFactory.create({
            fiscalYear: "2024-2025",
          })
          const matchingFiscalPeriod = await fiscalPeriodFactory.create({
            fundingPeriodId: matchingFundingPeriod.id,
            fiscalYear: "2024-25",
          })
          const otherFundingPeriod = await fundingPeriodFactory.create({
            fiscalYear: "2025-2026",
          })
          const otherFiscalPeriod = await fiscalPeriodFactory.create({
            fundingPeriodId: otherFundingPeriod.id,
            fiscalYear: "2025-26",
          })
          const category = await childCareSpaceCategoryFactory.create({
            fundingPeriodId: matchingFundingPeriod.id,
            categoryName: "Matching",
          })
          const matchingChildCareSpace = await childCareSpaceFactory
            .associations({
              centre,
              fiscalPeriod: matchingFiscalPeriod,
              category,
            })
            .create()
          const otherCategory = await childCareSpaceCategoryFactory.create({
            fundingPeriodId: otherFundingPeriod.id,
            categoryName: "Other",
          })
          await childCareSpaceFactory
            .associations({
              centre,
              fiscalPeriod: otherFiscalPeriod,
              category: otherCategory,
            })
            .create()

          // Act
          const childCareSpaces = await ChildCareSpace.withScope({
            method: ["byFiscalYear", "2024-25"],
          }).findAll()

          // Assert
          expect(childCareSpaces).toEqual([
            expect.objectContaining({
              id: matchingChildCareSpace.id,
              centreId: centre.id,
              fiscalPeriodId: matchingFiscalPeriod.id,
            }),
          ])
        })
      })
    })
  })
})
