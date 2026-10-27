import { FiscalPeriod } from "@/models"

import { fundingPeriodFactory } from "@/factories"

import fiscalPeriodFactory from "@/factories/fiscal-period-factory"

describe("tests/factories/fiscal-period-factory.ts", () => {
  describe("fiscalPeriodFactory", () => {
    describe("#create", () => {
      test("when a funding period is supplied by ID, derives the first fiscal month from it", async () => {
        // Arrange
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2024-2025" })

        // Act
        const fiscalPeriod = await fiscalPeriodFactory.create({ fundingPeriodId: fundingPeriod.id })

        // Assert
        const persistedFiscalPeriod = await FiscalPeriod.findByPk(fiscalPeriod.id)
        expect(persistedFiscalPeriod).toEqual(
          expect.objectContaining({
            fundingPeriodId: fundingPeriod.id,
            fiscalYear: "2024-25",
            month: FiscalPeriod.Months.APRIL,
            dateStart: new Date("2024-04-01T00:00:00.000Z"),
            dateEnd: new Date("2024-04-30T23:59:59.000Z"),
          })
        )
      })

      test("when a monthly date is explicit, preserves it and derives that month's end", async () => {
        // Arrange
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2024-2025" })

        // Act
        const fiscalPeriod = await fiscalPeriodFactory.associations({ fundingPeriod }).create({
          dateStart: new Date("2025-02-01T00:00:00.000Z"),
        })

        // Assert
        const persistedFiscalPeriod = await FiscalPeriod.findByPk(fiscalPeriod.id)
        expect(persistedFiscalPeriod).toEqual(
          expect.objectContaining({
            fundingPeriodId: fundingPeriod.id,
            fiscalYear: "2024-25",
            month: FiscalPeriod.Months.FEBRUARY,
            dateStart: new Date("2025-02-01T00:00:00.000Z"),
            dateEnd: new Date("2025-02-28T23:59:59.000Z"),
          })
        )
      })
    })
  })
})
