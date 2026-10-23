import { Log, QualityEnhancement } from "@/models"

import {
  centreFactory,
  fiscalPeriodFactory,
  fundingPeriodFactory,
  fundingRegionFactory,
  qualityEnhancementCategoryFactory,
  qualityEnhancementFactory,
  userFactory,
} from "@/factories"

import UpdateService from "@/services/centres/update-service"

describe("api/src/services/centres/update-service.ts", () => {
  describe("UpdateService", () => {
    describe("#perform", () => {
      test("when provided with valid attributes, updates the centre", async () => {
        // Arrange
        const currentUser = await userFactory.create()
        const centre = await centreFactory.create({
          name: "Original name",
          status: "Up to date",
        })

        const attributes = {
          name: "Updated name",
          status: "Inactive",
        }

        // Act
        const updatedCentre = await UpdateService.perform(centre, attributes, currentUser)

        // Assert
        expect(updatedCentre).toEqual(
          expect.objectContaining({
            id: centre.id,
            name: "Updated name",
            status: "Inactive",
          })
        )
      })

      test("when centre updated, logs update event", async () => {
        // Arrange
        const currentUser = await userFactory.create()
        const centre = await centreFactory.create({
          name: "Original name",
        })

        const attributes = {
          name: "Updated name",
        }

        // Act
        await UpdateService.perform(centre, attributes, currentUser)

        // Assert
        const logs = await Log.findAll()
        expect(logs).toEqual([
          expect.objectContaining({
            operation: Log.OperationTypes.UPDATE,
            tableName: "centres",
            userEmail: currentUser.email,
            data: JSON.stringify(centre),
          }),
        ])
      })

      describe("hot-meal transitions", () => {
        beforeEach(() => {
          vi.useFakeTimers()
        })

        afterEach(() => {
          vi.useRealTimers()
        })

        test("when enabling hot meals, updates current ledger amounts without rewriting past months", async () => {
          // Arrange
          vi.setSystemTime(new Date("2026-10-20T12:00:00Z"))

          const currentUser = await userFactory.create()
          const fundingRegion = await fundingRegionFactory.create({
            hotMealIncrementAmount: "32.0600",
          })
          const centre = await centreFactory.create({
            fundingRegionId: fundingRegion.id,
            hotMeal: false,
          })
          const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2026-2027" })
          const category = await qualityEnhancementCategoryFactory.create({
            fundingPeriodId: fundingPeriod.id,
            monthlyAmount: "100.0000",
          })
          const pastFiscalPeriod = await fiscalPeriodFactory.create({
            fundingPeriodId: fundingPeriod.id,
            fiscalYear: "2026-27",
            dateStart: new Date("2026-09-01"),
            dateEnd: new Date("2026-09-30T23:59:59Z"),
          })
          const currentFiscalPeriod = await fiscalPeriodFactory.create({
            fundingPeriodId: fundingPeriod.id,
            fiscalYear: "2026-27",
            dateStart: new Date("2026-10-01"),
            dateEnd: new Date("2026-10-31T23:59:59Z"),
          })
          const pastQualityEnhancement = await qualityEnhancementFactory
            .associations({ centre, category, fiscalPeriod: pastFiscalPeriod })
            .create({ actualChildOccupancyRate: "2.0000" })
          const currentQualityEnhancement = await qualityEnhancementFactory
            .associations({ centre, category, fiscalPeriod: currentFiscalPeriod })
            .create({ actualChildOccupancyRate: "2.0000" })

          // Act
          await UpdateService.perform(centre, { hotMeal: true }, currentUser)

          // Assert
          const qualityEnhancements = await QualityEnhancement.findAll()
          expect(qualityEnhancements).toEqual([
            expect.objectContaining({
              id: pastQualityEnhancement.id,
              monthlyAmount: "100",
              actualComputedTotal: "200",
            }),
            expect.objectContaining({
              id: currentQualityEnhancement.id,
              monthlyAmount: "132.06",
              actualComputedTotal: "264.12",
            }),
          ])
        })

        test("when disabling hot meals, restores current base amounts without rewriting past months", async () => {
          // Arrange
          vi.setSystemTime(new Date("2026-10-20T12:00:00Z"))

          const currentUser = await userFactory.create()
          const centre = await centreFactory.create({ hotMeal: true })
          const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2026-2027" })
          const category = await qualityEnhancementCategoryFactory.create({
            fundingPeriodId: fundingPeriod.id,
            monthlyAmount: "100.0000",
          })
          const pastFiscalPeriod = await fiscalPeriodFactory.create({
            fundingPeriodId: fundingPeriod.id,
            fiscalYear: "2026-27",
            dateStart: new Date("2026-09-01"),
            dateEnd: new Date("2026-09-30T23:59:59Z"),
          })
          const currentFiscalPeriod = await fiscalPeriodFactory.create({
            fundingPeriodId: fundingPeriod.id,
            fiscalYear: "2026-27",
            dateStart: new Date("2026-10-01"),
            dateEnd: new Date("2026-10-31T23:59:59Z"),
          })
          const pastQualityEnhancement = await qualityEnhancementFactory
            .associations({ centre, category, fiscalPeriod: pastFiscalPeriod })
            .create({
              hotMealIncrementAmount: "32.0600",
              hotMealAppliedAt: new Date("2026-09-01"),
              actualChildOccupancyRate: "2.0000",
            })
          const currentQualityEnhancement = await qualityEnhancementFactory
            .associations({ centre, category, fiscalPeriod: currentFiscalPeriod })
            .create({
              hotMealIncrementAmount: "32.0600",
              hotMealAppliedAt: new Date("2026-09-01"),
              actualChildOccupancyRate: "2.0000",
            })

          // Act
          await UpdateService.perform(centre, { hotMeal: false }, currentUser)

          // Assert
          const qualityEnhancements = await QualityEnhancement.findAll()
          expect(qualityEnhancements).toEqual([
            expect.objectContaining({
              id: pastQualityEnhancement.id,
              monthlyAmount: "132.06",
              actualComputedTotal: "264.12",
            }),
            expect.objectContaining({
              id: currentQualityEnhancement.id,
              monthlyAmount: "100",
              actualComputedTotal: "200",
            }),
          ])
        })
      })
    })
  })
})
