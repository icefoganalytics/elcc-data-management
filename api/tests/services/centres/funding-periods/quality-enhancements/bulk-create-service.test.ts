import {
  centreFactory,
  childCareSpaceCategoryFactory,
  fiscalPeriodFactory,
  fundingPeriodFactory,
  qualityEnhancementCategoryFactory,
} from "@/factories"
import QualityEnhancement from "@/models/quality-enhancement"
import BulkCreateService from "@/services/centres/funding-periods/quality-enhancements/bulk-create-service"

describe("api/src/services/centres/funding-periods/quality-enhancements/bulk-create-service.ts", () => {
  describe("BulkCreateService", () => {
    describe("#perform", () => {
      test("when initially provisioning a hot meal centre, snapshots configuration and the regional increment", async () => {
        // Arrange
        const centre = await centreFactory.create({}, { transient: { include: ["fundingRegion"] } })
        await centre.update({ hotMeal: true })
        await centre.fundingRegion?.update({ hotMealIncrementAmount: "32.0600" })
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2026-2027" })
        const period = await fiscalPeriodFactory.associations({ fundingPeriod }).create({
          fiscalYear: "2026-27",
          dateStart: new Date("2026-10-01T00:00:00.000Z"),
          dateEnd: new Date("2026-10-31T23:59:59.000Z"),
        })
        const spaceCategory = await childCareSpaceCategoryFactory
          .associations({ fundingPeriod })
          .create({ categoryName: "Infants" })
        const category = await qualityEnhancementCategoryFactory
          .associations({ fundingPeriod })
          .create({
            categoryName: "Infants Quality Enhancement",
            monthlyAmount: "206.1000",
          })
        await category.update({ childCareSpaceCategoryId: spaceCategory.id })

        // Act
        await BulkCreateService.perform(centre, fundingPeriod, true)

        // Assert
        const enhancements = await QualityEnhancement.findAll()
        expect(enhancements).toEqual([
          expect.objectContaining({
            centreId: centre.id,
            fiscalPeriodId: period.id,
            categoryId: category.id,
            childCareSpaceCategoryId: spaceCategory.id,
            lineName: "Infants Quality Enhancement",
            baseMonthlyAmount: "206.1",
            hotMealIncrementAmount: "32.06",
            monthlyAmount: "238.16",
            estimatedComputedTotal: "0",
            actualComputedTotal: "0",
          }),
        ])
      })
    })
  })
})
