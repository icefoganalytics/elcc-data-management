import { ChildCareSpace } from "@/models"

import { childCareSpaceFactory } from "@/factories"
import UpdateService from "@/services/child-care-spaces/update-service"

describe("api/src/services/child-care-spaces/update-service.ts", () => {
  describe("UpdateService", () => {
    describe("#perform", () => {
      test("when repricing follows loading, recalculates totals from the current price", async () => {
        // Arrange
        const controllerLoadedChildCareSpace = await childCareSpaceFactory.create({
          monthlyAmount: "100.0000",
          estimatedChildOccupancyRate: "0.8000",
          actualChildOccupancyRate: "0.5000",
        })

        const repricedChildCareSpace = await ChildCareSpace.findByPk(
          controllerLoadedChildCareSpace.id
        )
        if (repricedChildCareSpace === null) {
          throw new Error(`Expected Child Care Space ${controllerLoadedChildCareSpace.id} to exist`)
        }
        await repricedChildCareSpace.update({
          monthlyAmount: "200.0000",
        })

        // Act
        await UpdateService.perform(controllerLoadedChildCareSpace, {
          estimatedChildOccupancyRate: "0.5000",
          actualChildOccupancyRate: "0.2500",
        })

        // Assert
        const persistedChildCareSpace = await ChildCareSpace.findByPk(
          controllerLoadedChildCareSpace.id
        )
        expect(persistedChildCareSpace).toEqual(
          expect.objectContaining({
            monthlyAmount: "200",
            estimatedChildOccupancyRate: "0.5",
            actualChildOccupancyRate: "0.25",
            estimatedComputedTotal: "100",
            actualComputedTotal: "50",
          })
        )
      })
    })
  })
})
