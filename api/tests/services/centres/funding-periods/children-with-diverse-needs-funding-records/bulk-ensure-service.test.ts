import { type Attributes } from "@sequelize/core"

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
        const childrenWithDiverseNeedsFundingCategory =
          await childrenWithDiverseNeedsFundingCategoryFactory
            .associations({ fundingPeriod })
            .create({ categoryName: "Additional support", monthlyAmount: "123.4567" })
        await childrenWithDiverseNeedsFundingRecordFactory
          .associations({ fiscalPeriod, category: childrenWithDiverseNeedsFundingCategory })
          .create()
        const otherFundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2025-2026" })
        const otherFiscalPeriod = await fiscalPeriodFactory
          .associations({ fundingPeriod: otherFundingPeriod })
          .create()
        await childrenWithDiverseNeedsFundingRecordFactory
          .associations({ centre, fiscalPeriod: otherFiscalPeriod })
          .create()
        const fundingRecordFields: (keyof Attributes<ChildrenWithDiverseNeedsFundingRecord>)[] = [
          "centreId",
          "fiscalPeriodId",
          "categoryId",
          "lineName",
          "monthlyAmount",
          "estimatedChildOccupancyRate",
          "actualChildOccupancyRate",
          "estimatedComputedTotal",
          "actualComputedTotal",
          "deletedAt",
        ]
        const originalChildrenWithDiverseNeedsFundingRecords =
          await ChildrenWithDiverseNeedsFundingRecord.findAll({
            attributes: fundingRecordFields,
            paranoid: false,
            raw: true,
          })

        // Act
        await BulkEnsureService.perform(centre, fundingPeriod)
        await BulkEnsureService.perform(centre, fundingPeriod)

        // Assert
        const childrenWithDiverseNeedsFundingRecords =
          await ChildrenWithDiverseNeedsFundingRecord.findAll({
            attributes: fundingRecordFields,
            paranoid: false,
            raw: true,
          })
        expect(childrenWithDiverseNeedsFundingRecords).to.have.deep.members([
          ...originalChildrenWithDiverseNeedsFundingRecords,
          {
            centreId: centre.id,
            fiscalPeriodId: fiscalPeriod.id,
            categoryId: childrenWithDiverseNeedsFundingCategory.id,
            lineName: "Additional support",
            monthlyAmount: "123.4567",
            estimatedChildOccupancyRate: "0",
            actualChildOccupancyRate: "0",
            estimatedComputedTotal: "0",
            actualComputedTotal: "0",
            deletedAt: null,
          },
        ])
      })

      test("when a later-month snapshot exists, leaves the earlier month absent and preserves the saved snapshot", async () => {
        // Arrange
        const centre = await centreFactory.create()
        const fundingPeriod = await fundingPeriodFactory.create()
        await fiscalPeriodFactory
          .associations({ fundingPeriod })
          .create({ month: FiscalPeriod.Months.APRIL })
        const mayFiscalPeriod = await fiscalPeriodFactory
          .associations({ fundingPeriod })
          .create({ month: FiscalPeriod.Months.MAY })
        await childrenWithDiverseNeedsFundingRecordFactory
          .associations({ centre, fiscalPeriod: mayFiscalPeriod })
          .create({ estimatedChildOccupancyRate: "0.5000", actualChildOccupancyRate: "0.2500" })
        const originalChildrenWithDiverseNeedsFundingRecords =
          await ChildrenWithDiverseNeedsFundingRecord.findAll({
            paranoid: false,
            raw: true,
          })

        // Act
        await BulkEnsureService.perform(centre, fundingPeriod)

        // Assert
        const childrenWithDiverseNeedsFundingRecords =
          await ChildrenWithDiverseNeedsFundingRecord.findAll({
            paranoid: false,
            raw: true,
          })
        expect(childrenWithDiverseNeedsFundingRecords).to.have.deep.members(
          originalChildrenWithDiverseNeedsFundingRecords
        )
      })

      test("when all monthly snapshots were retired, repeated ensures preserve the retirement without creating replacements", async () => {
        // Arrange
        const centre = await centreFactory.create()
        const fundingPeriod = await fundingPeriodFactory.create()
        const fiscalPeriod = await fiscalPeriodFactory.associations({ fundingPeriod }).create()
        const childrenWithDiverseNeedsFundingRecord =
          await childrenWithDiverseNeedsFundingRecordFactory
            .associations({ centre, fiscalPeriod })
            .create()
        await childrenWithDiverseNeedsFundingRecord.destroy()
        const originalChildrenWithDiverseNeedsFundingRecords =
          await ChildrenWithDiverseNeedsFundingRecord.findAll({
            paranoid: false,
            raw: true,
          })

        // Act
        await BulkEnsureService.perform(centre, fundingPeriod)
        await BulkEnsureService.perform(centre, fundingPeriod)

        // Assert
        const childrenWithDiverseNeedsFundingRecords =
          await ChildrenWithDiverseNeedsFundingRecord.findAll({
            paranoid: false,
            raw: true,
          })
        expect(childrenWithDiverseNeedsFundingRecords).to.have.deep.members(
          originalChildrenWithDiverseNeedsFundingRecords
        )
      })
    })
  })
})
