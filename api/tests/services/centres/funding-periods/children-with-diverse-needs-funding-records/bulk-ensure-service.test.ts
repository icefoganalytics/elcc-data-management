import { ChildrenWithDiverseNeedsFundingRecord, FiscalPeriod } from "@/models"

import {
  centreFactory,
  childrenWithDiverseNeedsFundingCategoryFactory,
  childrenWithDiverseNeedsFundingRecordFactory,
  fiscalPeriodFactory,
  fundingPeriodFactory,
} from "@/factories"

import BulkEnsureService from "@/services/centres/funding-periods/children-with-diverse-needs-funding-records/bulk-ensure-service"

describe("api/src/services/centres/funding-periods/children-with-diverse-needs-funding-records/bulk-ensure-service.ts", () => {
  describe("BulkEnsureService", () => {
    describe("#perform", () => {
      test("when the centre and period have no history, repeated ensures provision one snapshot per category and month", async () => {
        // Arrange
        const centre = await centreFactory.create()
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2024-2025" })
        const fiscalPeriod = await fiscalPeriodFactory.associations({ fundingPeriod }).create()
        const category = await childrenWithDiverseNeedsFundingCategoryFactory
          .associations({ fundingPeriod })
          .create({ categoryName: "Additional support", monthlyAmount: "123.4567" })
        await childrenWithDiverseNeedsFundingRecordFactory
          .associations({ fiscalPeriod, category })
          .create()
        const otherFundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2025-2026" })
        const otherFiscalPeriod = await fiscalPeriodFactory
          .associations({ fundingPeriod: otherFundingPeriod })
          .create()
        await childrenWithDiverseNeedsFundingRecordFactory
          .associations({ centre, fiscalPeriod: otherFiscalPeriod })
          .create()

        // Act
        await BulkEnsureService.perform(centre, fundingPeriod)
        await BulkEnsureService.perform(centre, fundingPeriod)

        // Assert
        const records = await ChildrenWithDiverseNeedsFundingRecord.findAll({
          where: {
            centreId: centre.id,
            fiscalPeriodId: fiscalPeriod.id,
          },
        })
        expect(records).toEqual([
          expect.objectContaining({
            centreId: centre.id,
            fiscalPeriodId: fiscalPeriod.id,
            categoryId: category.id,
            lineName: "Additional support",
            monthlyAmount: "123.4567",
            estimatedChildOccupancyRate: "0",
            actualChildOccupancyRate: "0",
            estimatedComputedTotal: "0",
            actualComputedTotal: "0",
          }),
        ])
      })

      test("when a later-month snapshot exists, leaves the earlier month absent and preserves the saved snapshot", async () => {
        // Arrange
        const centre = await centreFactory.create()
        const fundingPeriod = await fundingPeriodFactory.create()
        await fiscalPeriodFactory
          .associations({ fundingPeriod })
          .create({ month: FiscalPeriod.Months.APRIL })
        const fiscalPeriod = await fiscalPeriodFactory
          .associations({ fundingPeriod })
          .create({ month: FiscalPeriod.Months.MAY })
        const record = await childrenWithDiverseNeedsFundingRecordFactory
          .associations({ centre, fiscalPeriod })
          .create({ estimatedChildOccupancyRate: "0.5000", actualChildOccupancyRate: "0.2500" })
        const originalRecords = await ChildrenWithDiverseNeedsFundingRecord.findAll({
          where: {
            id: record.id,
          },
          raw: true,
        })

        // Act
        await BulkEnsureService.perform(centre, fundingPeriod)

        // Assert
        const records = await ChildrenWithDiverseNeedsFundingRecord.findAll({
          where: {
            centreId: centre.id,
          },
          raw: true,
        })
        expect(records).toEqual(originalRecords)
      })

      test("when all monthly snapshots were retired, repeated ensures preserve the retirement without creating replacements", async () => {
        // Arrange
        const centre = await centreFactory.create()
        const fundingPeriod = await fundingPeriodFactory.create()
        const fiscalPeriod = await fiscalPeriodFactory.associations({ fundingPeriod }).create()
        const record = await childrenWithDiverseNeedsFundingRecordFactory
          .associations({ centre, fiscalPeriod })
          .create()
        await record.destroy()
        const originalRecords = await ChildrenWithDiverseNeedsFundingRecord.findAll({
          where: {
            id: record.id,
          },
          paranoid: false,
          raw: true,
        })

        // Act
        await BulkEnsureService.perform(centre, fundingPeriod)
        await BulkEnsureService.perform(centre, fundingPeriod)

        // Assert
        const records = await ChildrenWithDiverseNeedsFundingRecord.findAll({
          where: {
            centreId: centre.id,
          },
          paranoid: false,
          raw: true,
        })
        expect(records).toEqual(originalRecords)
      })
    })
  })
})
