import ChildrenWithDiverseNeedsFundingRecord from "@/models/children-with-diverse-needs-funding-record"

import {
  centreFactory,
  childrenWithChildrenWithDiverseNeedsFundingRecordsCategoryFactory,
  childrenWithChildrenWithDiverseNeedsFundingRecordsRecordFactory,
  fiscalPeriodFactory,
  fundingPeriodFactory,
} from "@/factories"
import { ReplicateEstimatesService } from "@/services/children-with-diverse-needs-funding-records/replicate-estimates-service"

describe("api/src/services/children-with-diverse-needs-funding-records/replicate-estimates-service.ts", () => {
  describe("ReplicateEstimatesService", () => {
    describe("#perform", () => {
      test("when a later row exists, updates its occupancy without repricing its snapshot", async () => {
        // Arrange
        const centre = await centreFactory.create()
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2025-2026" })
        const sourcePeriod = await fiscalPeriodFactory.associations({ fundingPeriod }).create({
          fiscalYear: "2025-26",
          dateStart: new Date("2025-04-01T00:00:00.000Z"),
          dateEnd: new Date("2025-04-30T23:59:59.000Z"),
        })
        const targetPeriod = await fiscalPeriodFactory.associations({ fundingPeriod }).create({
          fiscalYear: "2025-26",
          dateStart: new Date("2025-06-01T00:00:00.000Z"),
          dateEnd: new Date("2025-06-30T23:59:59.000Z"),
        })
        const category = await childrenWithChildrenWithDiverseNeedsFundingRecordsCategoryFactory
          .associations({ fundingPeriod })
          .create()
        const source = await childrenWithChildrenWithDiverseNeedsFundingRecordsRecordFactory
          .associations({ centre, fiscalPeriod: sourcePeriod, category })
          .create({ estimatedChildOccupancyRate: "0.6250", actualChildOccupancyRate: "0.4000" })
        const target = await childrenWithChildrenWithDiverseNeedsFundingRecordsRecordFactory
          .associations({ centre, fiscalPeriod: targetPeriod, category })
          .create({
            monthlyAmount: "20.0000",
            estimatedChildOccupancyRate: "0.1000",
            actualChildOccupancyRate: "0.8000",
          })

        // Act
        await ReplicateEstimatesService.perform(source)

        // Assert
        const updated = await ChildrenWithDiverseNeedsFundingRecord.findByPk(target.id)
        expect(updated).toMatchObject({
          monthlyAmount: "20",
          estimatedChildOccupancyRate: "0.625",
          actualChildOccupancyRate: "0",
          estimatedComputedTotal: "12.5",
          actualComputedTotal: "0",
        })
      })
    })
  })
})
