import {
  administrationCostCategoryFactory,
  administrationCostFactory,
  centreFactory,
  fiscalPeriodFactory,
  fundingPeriodFactory,
} from "@/factories"

import AdministrationCost from "@/models/administration-cost"

describe("api/src/models/administration-cost.ts", () => {
  describe("AdministrationCost", () => {
    describe("beforeSave", () => {
      test("when occupancy rates are saved, computes totals using exact decimal arithmetic", async () => {
        // Arrange
        const centre = await centreFactory.create()
        const fundingPeriod = await fundingPeriodFactory.create()
        const fiscalPeriod = await fiscalPeriodFactory
          .associations({
            fundingPeriod,
          })
          .create()
        const category = await administrationCostCategoryFactory
          .associations({
            fundingPeriod,
          })
          .create({
            monthlyAmount: "10.0000",
          })
        const administrationCost = administrationCostFactory
          .associations({
            centre,
            fiscalPeriod,
            category,
          })
          .build({
            monthlyAmount: "10.0000",
            estimatedChildOccupancyRate: "0.1234",
            actualChildOccupancyRate: "0.4000",
          })

        // Act
        await administrationCost.save()

        // Assert
        const persistedAdministrationCosts = await AdministrationCost.findAll()
        expect(persistedAdministrationCosts).toEqual([
          expect.objectContaining({
            id: administrationCost.id,
            estimatedComputedTotal: "1.234",
            actualComputedTotal: "4",
          }),
        ])
      })

      test("when estimated occupancy exceeds four decimal places, rejects the update", async () => {
        // Arrange
        const administrationCost = await administrationCostFactory.create()

        // Act
        const updatePromise = administrationCost.update({
          estimatedChildOccupancyRate: "0.12345",
        })

        // Assert
        await expect(updatePromise).rejects.toThrow("at most four decimal places")
      })

      test("when actual occupancy exceeds four decimal places, rejects the update", async () => {
        // Arrange
        const administrationCost = await administrationCostFactory.create()

        // Act
        const updatePromise = administrationCost.update({
          actualChildOccupancyRate: "0.12345",
        })

        // Assert
        await expect(updatePromise).rejects.toThrow("at most four decimal places")
      })

      test("when monthly amount exceeds four decimal places, rejects the update", async () => {
        // Arrange
        const administrationCost = await administrationCostFactory.create()

        // Act
        const updatePromise = administrationCost.update({
          monthlyAmount: "10.00001",
        })

        // Assert
        await expect(updatePromise).rejects.toThrow("at most four decimal places")
      })
    })

    describe("#update", () => {
      test("when returning is omitted, returns the database-generated update timestamp", async () => {
        // Arrange
        const administrationCost = await administrationCostFactory.create()

        // Act
        const updatedAdministrationCost = await administrationCost.update({
          estimatedChildOccupancyRate: "0.2500",
        })

        // Assert
        const persistedAdministrationCost = await AdministrationCost.findByPk(
          administrationCost.id,
          {
            rejectOnEmpty: true,
          }
        )
        expect(updatedAdministrationCost.updatedAt).toEqual(persistedAdministrationCost.updatedAt)
      })
    })
  })
})
