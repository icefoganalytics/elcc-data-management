import { ChildCareSpace } from "@/models"

import {
  centreFactory,
  childCareSpaceCategoryFactory,
  childCareSpaceFactory,
  fiscalPeriodFactory,
  fundingPeriodFactory,
} from "@/factories"

import ReplicateEstimatesService from "@/services/child-care-spaces/replicate-estimates-service"

describe("api/src/services/child-care-spaces/replicate-estimates-service.ts", () => {
  describe("ReplicateEstimatesService", () => {
    describe("#perform", () => {
      test("when later fiscal periods have matching Child Care Spaces rows, copies estimates and resets actuals", async () => {
        // Arrange
        const centre = await centreFactory.create()
        const fundingPeriod = await fundingPeriodFactory.create({
          fiscalYear: "2024-2025",
        })
        const aprilFiscalPeriod = await fiscalPeriodFactory.create({
          fundingPeriodId: fundingPeriod.id,
          fiscalYear: "2024-25",
          dateStart: new Date("2024-04-01"),
        })
        const mayFiscalPeriod = await fiscalPeriodFactory.create({
          fundingPeriodId: fundingPeriod.id,
          fiscalYear: "2024-25",
          dateStart: new Date("2024-05-01"),
        })
        const category = await childCareSpaceCategoryFactory
          .associations({ fundingPeriod })
          .create({ categoryName: "Infants" })
        const sourceChildCareSpace = await childCareSpaceFactory
          .associations({
            centre,
            fiscalPeriod: aprilFiscalPeriod,
            category,
          })
          .create({
            monthlyAmount: "100.0000",
            estimatedChildOccupancyRate: "0.8000",
            actualChildOccupancyRate: "0.7500",
          })
        const laterChildCareSpace = await childCareSpaceFactory
          .associations({
            centre,
            fiscalPeriod: mayFiscalPeriod,
            category,
          })
          .create({
            monthlyAmount: "100.0000",
            estimatedChildOccupancyRate: "0.1000",
            actualChildOccupancyRate: "0.5000",
          })

        // Act
        await ReplicateEstimatesService.perform(sourceChildCareSpace)
        await laterChildCareSpace.reload()

        // Assert
        expect(laterChildCareSpace).toEqual(
          expect.objectContaining({
            estimatedChildOccupancyRate: "0.8",
            actualChildOccupancyRate: "0",
            estimatedComputedTotal: "80",
            actualComputedTotal: "0",
          })
        )
      })

      test("when estimates and prices change after loading, uses current values", async () => {
        // Arrange
        const centre = await centreFactory.create()
        const fundingPeriod = await fundingPeriodFactory.create({
          fiscalYear: "2024-2025",
        })
        const aprilFiscalPeriod = await fiscalPeriodFactory.create({
          fundingPeriodId: fundingPeriod.id,
          fiscalYear: "2024-25",
          dateStart: new Date("2024-04-01"),
        })
        const mayFiscalPeriod = await fiscalPeriodFactory.create({
          fundingPeriodId: fundingPeriod.id,
          fiscalYear: "2024-25",
          dateStart: new Date("2024-05-01"),
        })
        const category = await childCareSpaceCategoryFactory
          .associations({ fundingPeriod })
          .create({ categoryName: "Infants" })
        const sourceChildCareSpace = await childCareSpaceFactory
          .associations({
            centre,
            fiscalPeriod: aprilFiscalPeriod,
            category,
          })
          .create({
            monthlyAmount: "100.0000",
            estimatedChildOccupancyRate: "0.8000",
            actualChildOccupancyRate: "0.7500",
          })
        const futureChildCareSpace = await childCareSpaceFactory
          .associations({
            centre,
            fiscalPeriod: mayFiscalPeriod,
            category,
          })
          .create({
            monthlyAmount: "100.0000",
            estimatedChildOccupancyRate: "0.1000",
            actualChildOccupancyRate: "0.5000",
          })

        const currentSourceChildCareSpace = await ChildCareSpace.findByPk(sourceChildCareSpace.id)
        if (currentSourceChildCareSpace === null) {
          throw new Error(`Expected Child Care Space ${sourceChildCareSpace.id} to exist`)
        }
        await currentSourceChildCareSpace.update({
          estimatedChildOccupancyRate: "0.6000",
        })

        const currentFutureChildCareSpace = await ChildCareSpace.findByPk(futureChildCareSpace.id)
        if (currentFutureChildCareSpace === null) {
          throw new Error(`Expected Child Care Space ${futureChildCareSpace.id} to exist`)
        }
        await currentFutureChildCareSpace.update({
          monthlyAmount: "200.0000",
        })

        // Act
        await ReplicateEstimatesService.perform(sourceChildCareSpace)

        // Assert
        await expect(futureChildCareSpace.reload()).resolves.toEqual(
          expect.objectContaining({
            monthlyAmount: "200",
            estimatedChildOccupancyRate: "0.6",
            actualChildOccupancyRate: "0",
            estimatedComputedTotal: "120",
            actualComputedTotal: "0",
          })
        )
      })
    })
  })
})
