import { centreFactory, childCareSpaceFactory, fiscalPeriodFactory, userFactory } from "@/factories"
import { IndexService } from "@/services/child-care-spaces"

describe("api/src/services/child-care-spaces/index-service.ts", () => {
  describe("IndexService", () => {
    describe("#perform", () => {
      test("when results are paginated, summarizes all matching active rows with exact decimals", async () => {
        // Arrange
        const currentUser = await userFactory.create()
        const centre = await centreFactory.create()
        const fiscalPeriod = await fiscalPeriodFactory.create()
        await childCareSpaceFactory.associations({ centre, fiscalPeriod }).create({
          monthlyAmount: "10.1234",
          estimatedChildOccupancyRate: "1.0000",
          actualChildOccupancyRate: "3.0000",
        })
        await childCareSpaceFactory.associations({ centre, fiscalPeriod }).create({
          monthlyAmount: "20.2345",
          estimatedChildOccupancyRate: "2.0000",
          actualChildOccupancyRate: "4.0000",
        })
        const retiredSpace = await childCareSpaceFactory.associations({ centre, fiscalPeriod }).create({
          monthlyAmount: "999.0000",
          estimatedChildOccupancyRate: "9.0000",
          actualChildOccupancyRate: "9.0000",
        })
        await retiredSpace.destroy()
        await childCareSpaceFactory.associations({ fiscalPeriod }).create({
          monthlyAmount: "888.0000",
          estimatedChildOccupancyRate: "8.0000",
          actualChildOccupancyRate: "8.0000",
        })

        // Act
        const { summaries } = await IndexService.perform(
          { centreId: centre.id, fiscalPeriodId: fiscalPeriod.id },
          [],
          [["id", "ASC"]],
          1,
          1,
          currentUser
        )

        // Assert
        expect(summaries).toEqual({
          totalEstimated: "50.5924",
          totalActual: "111.3082",
          totalEstimatedOccupancy: "3.0000",
          totalActualOccupancy: "7.0000",
        })
      })

      test("when no rows match, returns zero decimal summaries", async () => {
        // Arrange
        const currentUser = await userFactory.create()
        await childCareSpaceFactory.create()

        // Act
        const { summaries } = await IndexService.perform({ id: -1 }, [], undefined, 10, 0, currentUser)

        // Assert
        expect(summaries).toEqual({
          totalEstimated: "0.0000",
          totalActual: "0.0000",
          totalEstimatedOccupancy: "0.0000",
          totalActualOccupancy: "0.0000",
        })
      })
    })
  })
})
