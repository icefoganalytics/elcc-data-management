import { AdministrationCost, ChildCareSpace, QualityEnhancement } from "@/models"

import {
  administrationCostFactory,
  childCareSpaceFactory,
  fiscalPeriodFactory,
  qualityEnhancementFactory,
} from "@/factories"
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

      test("when Spaces occupancy changes, updates only linked Administration rows for that centre and month", async () => {
        // Arrange
        const fiscalPeriod = await fiscalPeriodFactory.create()
        const childCareSpace = await childCareSpaceFactory.associations({ fiscalPeriod }).create({
          estimatedChildOccupancyRate: "0.8000",
          actualChildOccupancyRate: "0.4000",
        })
        const linkedCost = await administrationCostFactory.associations({ fiscalPeriod }).create({
          centreId: childCareSpace.centreId,
          childCareSpaceCategoryId: childCareSpace.categoryId,
          monthlyAmount: "30.0000",
          estimatedChildOccupancyRate: "0.8000",
          actualChildOccupancyRate: "0.4000",
        })
        const otherCentreCost = await administrationCostFactory
          .associations({ fiscalPeriod })
          .create({
            childCareSpaceCategoryId: childCareSpace.categoryId,
            monthlyAmount: "40.0000",
            estimatedChildOccupancyRate: "0.7000",
            actualChildOccupancyRate: "0.3000",
          })

        // Act
        await UpdateService.perform(childCareSpace, {
          estimatedChildOccupancyRate: "0.5000",
          actualChildOccupancyRate: "0.2500",
        })

        // Assert
        const costs = await AdministrationCost.findAll({ order: [["id", "ASC"]] })
        expect(costs).toEqual([
          expect.objectContaining({
            id: linkedCost.id,
            monthlyAmount: "30",
            estimatedChildOccupancyRate: "0.5",
            actualChildOccupancyRate: "0.25",
            estimatedComputedTotal: "15",
            actualComputedTotal: "7.5",
          }),
          expect.objectContaining({
            id: otherCentreCost.id,
            monthlyAmount: "40",
            estimatedChildOccupancyRate: "0.7",
            actualChildOccupancyRate: "0.3",
            estimatedComputedTotal: "28",
            actualComputedTotal: "12",
          }),
        ])
      })

      test("when Spaces occupancy changes, preserves Quality Enhancement prices and other months", async () => {
        // Arrange
        const fiscalPeriod = await fiscalPeriodFactory.create()
        const childCareSpace = await childCareSpaceFactory.associations({ fiscalPeriod }).create({
          estimatedChildOccupancyRate: "0.8000",
          actualChildOccupancyRate: "0.4000",
        })
        const linkedEnhancement = await qualityEnhancementFactory
          .associations({ fiscalPeriod })
          .create({
            centreId: childCareSpace.centreId,
            childCareSpaceCategoryId: childCareSpace.categoryId,
            baseMonthlyAmount: "100.0000",
            hotMealIncrementAmount: "10.0000",
            estimatedChildOccupancyRate: "0.8000",
            actualChildOccupancyRate: "0.4000",
          })
        const otherMonth = await fiscalPeriodFactory.create({
          fundingPeriodId: fiscalPeriod.fundingPeriodId,
          dateStart: new Date("2026-05-01"),
        })
        const otherMonthEnhancement = await qualityEnhancementFactory
          .associations({ fiscalPeriod: otherMonth })
          .create({
            centreId: childCareSpace.centreId,
            childCareSpaceCategoryId: childCareSpace.categoryId,
            baseMonthlyAmount: "200.0000",
            hotMealIncrementAmount: "20.0000",
            estimatedChildOccupancyRate: "0.7000",
            actualChildOccupancyRate: "0.3000",
          })

        // Act
        await UpdateService.perform(childCareSpace, {
          estimatedChildOccupancyRate: "0.5000",
          actualChildOccupancyRate: "0.2500",
        })

        // Assert
        const enhancements = await QualityEnhancement.findAll({ order: [["id", "ASC"]] })
        expect(enhancements).toEqual([
          expect.objectContaining({
            id: linkedEnhancement.id,
            baseMonthlyAmount: "100",
            hotMealIncrementAmount: "10",
            monthlyAmount: "110",
            estimatedChildOccupancyRate: "0.5",
            actualChildOccupancyRate: "0.25",
            estimatedComputedTotal: "55",
            actualComputedTotal: "27.5",
          }),
          expect.objectContaining({
            id: otherMonthEnhancement.id,
            baseMonthlyAmount: "200",
            hotMealIncrementAmount: "20",
            monthlyAmount: "220",
            estimatedChildOccupancyRate: "0.7",
            actualChildOccupancyRate: "0.3",
            estimatedComputedTotal: "154",
            actualComputedTotal: "66",
          }),
        ])
      })

      test("when Spaces occupancy is unchanged, preserves separately edited ledger occupancy", async () => {
        // Arrange
        const fiscalPeriod = await fiscalPeriodFactory.create()
        const childCareSpace = await childCareSpaceFactory.associations({ fiscalPeriod }).create({
          estimatedChildOccupancyRate: "0.5000",
          actualChildOccupancyRate: "0.2500",
        })
        const cost = await administrationCostFactory.associations({ fiscalPeriod }).create({
          centreId: childCareSpace.centreId,
          childCareSpaceCategoryId: childCareSpace.categoryId,
          monthlyAmount: "30.0000",
          estimatedChildOccupancyRate: "0.6000",
          actualChildOccupancyRate: "0.3000",
        })

        // Act
        await UpdateService.perform(childCareSpace, {
          estimatedChildOccupancyRate: "0.5",
          actualChildOccupancyRate: "0.25",
        })

        // Assert
        const persistedCost = await cost.reload()
        expect(persistedCost).toEqual(
          expect.objectContaining({
            estimatedChildOccupancyRate: "0.6",
            actualChildOccupancyRate: "0.3",
            estimatedComputedTotal: "18",
            actualComputedTotal: "9",
          })
        )
      })
    })
  })
})
