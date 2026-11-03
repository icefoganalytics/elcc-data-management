import { childrenWithDiverseNeedsFundingRecordFactory } from "@/factories/children-with-diverse-needs-funding-record-factory"
import ChildrenWithDiverseNeedsFundingRecord from "@/models/children-with-diverse-needs-funding-record"

describe("api/src/models/children-with-diverse-needs-funding-record.ts", () => {
  describe("ChildrenWithDiverseNeedsFundingRecord", () => {
    describe("#update", () => {
      test("when occupancies change, calculates estimated and actual totals from the saved monthly snapshot", async () => {
        // Arrange
        const childrenWithDiverseNeedsFundingRecord =
          await childrenWithDiverseNeedsFundingRecordFactory.create({
            monthlyAmount: "54.9600",
            estimatedChildOccupancyRate: "0.3333",
            actualChildOccupancyRate: "0.2000",
          })

        // Act
        await childrenWithDiverseNeedsFundingRecord.update({
          estimatedChildOccupancyRate: "0.2500",
          actualChildOccupancyRate: "0.1250",
        })

        // Assert
        const persisted = await ChildrenWithDiverseNeedsFundingRecord.findByPk(
          childrenWithDiverseNeedsFundingRecord.id
        )
        expect(persisted).toMatchObject({
          monthlyAmount: "54.96",
          estimatedChildOccupancyRate: "0.25",
          actualChildOccupancyRate: "0.125",
          estimatedComputedTotal: "13.74",
          actualComputedTotal: "6.87",
        })
      })

      test("when occupancy exceeds four decimal places, rejects the value", async () => {
        // Arrange
        const childrenWithDiverseNeedsFundingRecord =
          await childrenWithDiverseNeedsFundingRecordFactory.create()

        // Act / Assert
        await expect(
          childrenWithDiverseNeedsFundingRecord.update({ estimatedChildOccupancyRate: "0.12345" })
        ).rejects.toThrow("at most four decimal places")
      })
    })
  })
})
