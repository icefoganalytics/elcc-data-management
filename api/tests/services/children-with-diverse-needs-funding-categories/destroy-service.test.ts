import {
  ChildrenWithDiverseNeedsFundingCategory,
  ChildrenWithDiverseNeedsFundingRecord,
} from "@/models"

import {
  childrenWithDiverseNeedsFundingCategoryFactory,
  childrenWithDiverseNeedsFundingRecordFactory,
  fiscalPeriodFactory,
} from "@/factories"

import { DestroyService } from "@/services/children-with-diverse-needs-funding-categories/destroy-service"

describe("api/src/services/children-with-diverse-needs-funding-categories/destroy-service.ts", () => {
  describe("DestroyService", () => {
    describe("#perform", () => {
      test("when a category has active monthly records, retires its annual configuration without removing it", async () => {
        // Arrange
        const category = await childrenWithDiverseNeedsFundingCategoryFactory.create()
        const fiscalPeriod = await fiscalPeriodFactory.create({
          fundingPeriodId: category.fundingPeriodId,
        })
        await childrenWithDiverseNeedsFundingRecordFactory
          .associations({ category, fiscalPeriod })
          .create()

        // Act
        await DestroyService.perform(category)

        // Assert
        const retiredCategory = await ChildrenWithDiverseNeedsFundingCategory.findByPk(
          category.id,
          { paranoid: false }
        )
        expect(retiredCategory).toMatchObject({
          id: category.id,
          fundingPeriodId: category.fundingPeriodId,
          deletedAt: expect.any(Date),
        })
      })

      test("when a category is retired, preserves active monthly funding snapshots and exact historical rates", async () => {
        // Arrange
        const category = await childrenWithDiverseNeedsFundingCategoryFactory.create({
          categoryName: "Current support",
          monthlyAmount: "114.5000",
        })
        const fiscalPeriod = await fiscalPeriodFactory.create({
          fundingPeriodId: category.fundingPeriodId,
        })
        const fundingRecord = await childrenWithDiverseNeedsFundingRecordFactory
          .associations({ category, fiscalPeriod })
          .create({
            lineName: "Historical support",
            monthlyAmount: "54.9612",
            estimatedChildOccupancyRate: "0.2500",
            actualChildOccupancyRate: "0.7500",
          })

        // Act
        await DestroyService.perform(category)

        // Assert
        const preservedFundingRecords = await ChildrenWithDiverseNeedsFundingRecord.findAll({
          where: { categoryId: category.id },
        })
        expect(preservedFundingRecords).toEqual([
          expect.objectContaining({
            id: fundingRecord.id,
            centreId: fundingRecord.centreId,
            fiscalPeriodId: fiscalPeriod.id,
            categoryId: category.id,
            lineName: "Historical support",
            monthlyAmount: "54.9612",
            estimatedChildOccupancyRate: "0.25",
            actualChildOccupancyRate: "0.75",
            estimatedComputedTotal: "13.7403",
            actualComputedTotal: "41.2209",
            deletedAt: null,
          }),
        ])
      })
    })
  })
})
