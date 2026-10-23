import {
  centreFactory,
  fiscalPeriodFactory,
  fundingPeriodFactory,
  qualityEnhancementCategoryFactory,
  qualityEnhancementFactory,
} from "@/factories"
import QualityEnhancement from "@/models/quality-enhancement"
import BulkEnsureService from "@/services/centres/funding-periods/quality-enhancements/bulk-ensure-service"

describe("api/src/services/centres/funding-periods/quality-enhancements/bulk-ensure-service.ts", () => {
  describe("BulkEnsureService", () => {
    describe("#perform", () => {
      test("when provisioned rows already exist, preserves absent months and retired categories", async () => {
        // Arrange
        const centre = await centreFactory.create()
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2026-2027" })
        const firstPeriod = await fiscalPeriodFactory.associations({ fundingPeriod }).create({
          fiscalYear: "2026-27",
          dateStart: new Date("2026-04-01T00:00:00.000Z"),
          dateEnd: new Date("2026-04-30T23:59:59.000Z"),
        })
        await fiscalPeriodFactory.associations({ fundingPeriod }).create({
          fiscalYear: "2026-27",
          dateStart: new Date("2026-05-01T00:00:00.000Z"),
          dateEnd: new Date("2026-05-31T23:59:59.000Z"),
        })
        const activeCategory = await qualityEnhancementCategoryFactory
          .associations({ fundingPeriod })
          .create()
        const retiredCategory = await qualityEnhancementCategoryFactory
          .associations({ fundingPeriod })
          .create()
        await retiredCategory.destroy()
        const existing = await qualityEnhancementFactory
          .associations({ centre, fiscalPeriod: firstPeriod, category: activeCategory })
          .create()

        // Act
        await BulkEnsureService.perform(centre, fundingPeriod, true)

        // Assert
        const persisted = await QualityEnhancement.findAll()
        expect(persisted).toEqual([
          expect.objectContaining({
            id: existing.id,
          }),
        ])
      })
    })
  })
})
