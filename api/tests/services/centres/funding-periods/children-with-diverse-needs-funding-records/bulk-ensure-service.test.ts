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
        const otherCentreFundingRecord = await childrenWithDiverseNeedsFundingRecordFactory
          .associations({ fiscalPeriod, category: childrenWithDiverseNeedsFundingCategory })
          .create({
            lineName: "Other centre support",
            monthlyAmount: "100.0000",
            estimatedChildOccupancyRate: "0.5000",
            actualChildOccupancyRate: "0.2500",
          })
        const otherFundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2025-2026" })
        const otherFiscalPeriod = await fiscalPeriodFactory
          .associations({ fundingPeriod: otherFundingPeriod })
          .create()
        const otherYearFundingRecord = await childrenWithDiverseNeedsFundingRecordFactory
          .associations({ centre, fiscalPeriod: otherFiscalPeriod })
          .create({
            lineName: "Other year support",
            monthlyAmount: "200.0000",
            estimatedChildOccupancyRate: "0.7500",
            actualChildOccupancyRate: "0.5000",
          })

        // Act
        await BulkEnsureService.perform(centre, fundingPeriod)
        await BulkEnsureService.perform(centre, fundingPeriod)

        // Assert
        const childrenWithDiverseNeedsFundingRecords =
          await ChildrenWithDiverseNeedsFundingRecord.findAll({
            paranoid: false,
          })
        expect(childrenWithDiverseNeedsFundingRecords).toEqual([
          expect.objectContaining({
            id: otherCentreFundingRecord.id,
            centreId: otherCentreFundingRecord.centreId,
            fiscalPeriodId: fiscalPeriod.id,
            categoryId: childrenWithDiverseNeedsFundingCategory.id,
            lineName: "Other centre support",
            monthlyAmount: "100",
            estimatedChildOccupancyRate: "0.5",
            actualChildOccupancyRate: "0.25",
            estimatedComputedTotal: "50",
            actualComputedTotal: "25",
            deletedAt: null,
          }),
          expect.objectContaining({
            id: otherYearFundingRecord.id,
            centreId: centre.id,
            fiscalPeriodId: otherFiscalPeriod.id,
            categoryId: otherYearFundingRecord.categoryId,
            lineName: "Other year support",
            monthlyAmount: "200",
            estimatedChildOccupancyRate: "0.75",
            actualChildOccupancyRate: "0.5",
            estimatedComputedTotal: "150",
            actualComputedTotal: "100",
            deletedAt: null,
          }),
          expect.objectContaining({
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
        const mayFiscalPeriod = await fiscalPeriodFactory
          .associations({ fundingPeriod })
          .create({ month: FiscalPeriod.Months.MAY })
        const mayFundingRecord = await childrenWithDiverseNeedsFundingRecordFactory
          .associations({ centre, fiscalPeriod: mayFiscalPeriod })
          .create({
            lineName: "Saved support",
            monthlyAmount: "100.0000",
            estimatedChildOccupancyRate: "0.5000",
            actualChildOccupancyRate: "0.2500",
          })

        // Act
        await BulkEnsureService.perform(centre, fundingPeriod)

        // Assert
        const childrenWithDiverseNeedsFundingRecords =
          await ChildrenWithDiverseNeedsFundingRecord.findAll({
            paranoid: false,
          })
        expect(childrenWithDiverseNeedsFundingRecords).toEqual([
          expect.objectContaining({
            id: mayFundingRecord.id,
            centreId: centre.id,
            fiscalPeriodId: mayFiscalPeriod.id,
            categoryId: mayFundingRecord.categoryId,
            lineName: "Saved support",
            monthlyAmount: "100",
            estimatedChildOccupancyRate: "0.5",
            actualChildOccupancyRate: "0.25",
            estimatedComputedTotal: "50",
            actualComputedTotal: "25",
            deletedAt: null,
          }),
        ])
      })

      test("when all monthly snapshots were retired, repeated ensures preserve the retirement without creating replacements", async () => {
        // Arrange
        const centre = await centreFactory.create()
        const fundingPeriod = await fundingPeriodFactory.create()
        const fiscalPeriod = await fiscalPeriodFactory.associations({ fundingPeriod }).create()
        const childrenWithDiverseNeedsFundingRecord =
          await childrenWithDiverseNeedsFundingRecordFactory
            .associations({ centre, fiscalPeriod })
            .create({
              lineName: "Retired support",
              monthlyAmount: "100.0000",
              estimatedChildOccupancyRate: "0.5000",
              actualChildOccupancyRate: "0.2500",
            })
        await childrenWithDiverseNeedsFundingRecord.destroy()

        // Act
        await BulkEnsureService.perform(centre, fundingPeriod)
        await BulkEnsureService.perform(centre, fundingPeriod)

        // Assert
        const childrenWithDiverseNeedsFundingRecords =
          await ChildrenWithDiverseNeedsFundingRecord.findAll({
            paranoid: false,
          })
        expect(childrenWithDiverseNeedsFundingRecords).toEqual([
          expect.objectContaining({
            id: childrenWithDiverseNeedsFundingRecord.id,
            centreId: centre.id,
            fiscalPeriodId: fiscalPeriod.id,
            categoryId: childrenWithDiverseNeedsFundingRecord.categoryId,
            lineName: "Retired support",
            monthlyAmount: "100",
            estimatedChildOccupancyRate: "0.5",
            actualChildOccupancyRate: "0.25",
            estimatedComputedTotal: "50",
            actualComputedTotal: "25",
            deletedAt: childrenWithDiverseNeedsFundingRecord.deletedAt,
          }),
        ])
      })
    })
  })
})
