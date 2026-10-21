import {
  childCareSpaceCategoryFactory,
  fundingPeriodFactory,
  qualityEnhancementCategoryFactory,
} from "@/factories"
import QualityEnhancementCategory from "@/models/quality-enhancement-category"
import BulkCreateService from "@/services/funding-periods/quality-enhancement-categories/bulk-create-service"

describe("api/src/services/funding-periods/quality-enhancement-categories/bulk-create-service.ts", () => {
  test("when cloning a funding period, preserves configuration and remaps the space link", async () => {
    // Arrange
    const previousFundingPeriod = await fundingPeriodFactory.create({
      fiscalYear: "2025-2026",
      fromDate: new Date("2025-04-01T00:00:00.000Z"),
    })
    const targetFundingPeriod = await fundingPeriodFactory.create({
      fiscalYear: "2026-2027",
      fromDate: new Date("2026-04-01T00:00:00.000Z"),
    })
    const previousSpaceCategory = await childCareSpaceCategoryFactory
      .associations({ fundingPeriod: previousFundingPeriod })
      .create({ categoryName: "Infants" })
    const targetSpaceCategory = await childCareSpaceCategoryFactory
      .associations({ fundingPeriod: targetFundingPeriod })
      .create({ categoryName: "Infants" })
    await qualityEnhancementCategoryFactory
      .associations({ fundingPeriod: previousFundingPeriod })
      .create({
        categoryName: "Infants Quality Enhancement",
        fromAge: 0,
        toAge: 1,
        monthlyAmount: "206.1000",
        childCareSpaceCategoryId: previousSpaceCategory.id,
      })

    // Act
    await BulkCreateService.perform(targetFundingPeriod)

    // Assert
    const persistedCategories = await QualityEnhancementCategory.findAll({
      where: { fundingPeriodId: targetFundingPeriod.id },
    })
    expect(persistedCategories).toEqual([
      expect.objectContaining({
        fundingPeriodId: targetFundingPeriod.id,
        categoryName: "Infants Quality Enhancement",
        fromAge: 0,
        toAge: 1,
        monthlyAmount: "206.1",
        childCareSpaceCategoryId: targetSpaceCategory.id,
      }),
    ])
  })

  test("when the newest configuration was deliberately emptied, does not revive older categories", async () => {
    // Arrange
    const olderFundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2024-2025" })
    const latestFundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2025-2026" })
    const targetFundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2026-2027" })
    await qualityEnhancementCategoryFactory
      .associations({ fundingPeriod: olderFundingPeriod })
      .create()
    const retiredCategory = await qualityEnhancementCategoryFactory
      .associations({ fundingPeriod: latestFundingPeriod })
      .create()
    await retiredCategory.destroy()

    // Act
    await BulkCreateService.perform(targetFundingPeriod)

    // Assert
    const categories = await QualityEnhancementCategory.findAll({
      where: { fundingPeriodId: targetFundingPeriod.id },
    })
    expect(categories).toEqual([])
  })

  test("when a source space category was retired, remaps its explicit link to the active target category", async () => {
    // Arrange
    const previousFundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2025-2026" })
    const targetFundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2026-2027" })
    const previousSpaceCategory = await childCareSpaceCategoryFactory
      .associations({ fundingPeriod: previousFundingPeriod })
      .create({ categoryName: "Infants" })
    const targetSpaceCategory = await childCareSpaceCategoryFactory
      .associations({ fundingPeriod: targetFundingPeriod })
      .create({ categoryName: "Infants" })
    await qualityEnhancementCategoryFactory
      .associations({ fundingPeriod: previousFundingPeriod })
      .create({
        categoryName: "Infants Quality Enhancement",
        childCareSpaceCategoryId: previousSpaceCategory.id,
      })
    await previousSpaceCategory.destroy()

    // Act
    await BulkCreateService.perform(targetFundingPeriod)

    // Assert
    const categories = await QualityEnhancementCategory.findAll({
      where: { fundingPeriodId: targetFundingPeriod.id },
    })
    expect(categories).toEqual([
      expect.objectContaining({
        childCareSpaceCategoryId: targetSpaceCategory.id,
      }),
    ])
  })
})
