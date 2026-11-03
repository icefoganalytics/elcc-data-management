import { childrenWithChildrenWithDiverseNeedsFundingRecordsRecordFactory } from "@/factories/children-with-diverse-needs-funding-record-factory"
import ChildrenWithDiverseNeedsFundingRecord from "@/models/children-with-diverse-needs-funding-record"

describe("api/src/models/children-with-diverse-needs-funding-record.ts", () => {
  describe("ChildrenWithDiverseNeedsFundingRecord", () => {
    describe("#validate", () => {
      test.each([
        "monthlyAmount",
        "estimatedChildOccupancyRate",
        "actualChildOccupancyRate",
      ] as const)("when %s exceeds four decimal places, rejects the value", async (attribute) => {
        // Arrange
        const record = childrenWithDiverseNeedsFundingRecordFactory.build({
          centreId: 1,
          fiscalPeriodId: 1,
          categoryId: 1,
          [attribute]: "0.12345",
        })

        // Act
        const validation = record.validate()

        // Assert
        await expect(validation).rejects.toThrow("at most four decimal places")
      })
    })

    describe("#update", () => {
      test("when occupancies change with unused trailing zeros, calculates totals from the saved monthly snapshot", async () => {
        // Arrange
        const childrenWithDiverseNeedsFundingRecord =
          await childrenWithDiverseNeedsFundingRecordFactory.create({
            monthlyAmount: "54.96000",
            estimatedChildOccupancyRate: "0.33330",
            actualChildOccupancyRate: "0.20000",
          })

        // Act
        await childrenWithDiverseNeedsFundingRecord.update({
          estimatedChildOccupancyRate: "0.25000",
          actualChildOccupancyRate: "0.12500",
        })

        // Assert
        const persisted = await ChildrenWithDiverseNeedsFundingRecord.findByPk(
          childrenWithChildrenWithDiverseNeedsFundingRecordsRecord.id
        )
        expect(persisted).toMatchObject({
          monthlyAmount: "54.96",
          estimatedChildOccupancyRate: "0.25",
          actualChildOccupancyRate: "0.125",
          estimatedComputedTotal: "13.74",
          actualComputedTotal: "6.87",
        })
      })

      test.each([
        "monthlyAmount",
        "estimatedChildOccupancyRate",
        "actualChildOccupancyRate",
      ] as const)("when %s exceeds four decimal places, rejects the update", async (attribute) => {
        // Arrange
        const childrenWithChildrenWithDiverseNeedsFundingRecordsRecord = await childrenWithChildrenWithDiverseNeedsFundingRecordsRecordFactory.create()

        // Act / Assert
        await expect(
          childrenWithDiverseNeedsFundingRecord.update({ [attribute]: "0.12345" })
        ).rejects.toThrow("at most four decimal places")
      })
    })
  })
})
