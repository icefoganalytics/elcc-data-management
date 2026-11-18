import { ChildCareSpace, AdministrationCost, QualityEnhancement } from "@/models"
import {
  childCareCategoryFactory,
  childCareSpaceCategoryFactory,
  administrationCostCategoryFactory,
  qualityEnhancementCategoryFactory,
  childCareSpaceFactory,
  administrationCostFactory,
  qualityEnhancementFactory,
  fiscalPeriodFactory,
} from "@/factories"
import UpdateService from "@/services/child-care-categories/update-service"

describe("api/src/services/child-care-categories/update-service.ts", () => {
  describe("UpdateService", () => {
    describe("#perform", () => {
      test("shared metadata edits preserve all monthly name, rate, and propagation snapshots", async () => {
        const childCareCategory = await childCareCategoryFactory.create({ categoryName: "Infants" })
        const fundingPeriodId = childCareCategory.fundingPeriodId
        const fiscalPeriod = await fiscalPeriodFactory.create({ fundingPeriodId })
        const spacesCategory = await childCareSpaceCategoryFactory.create({
          fundingPeriodId,
          childCareCategoryId: childCareCategory.id,
        })
        const administrationCategory = await administrationCostCategoryFactory.create({
          fundingPeriodId,
          childCareCategoryId: childCareCategory.id,
        })
        const qualityCategory = await qualityEnhancementCategoryFactory.create({
          fundingPeriodId,
          childCareCategoryId: childCareCategory.id,
        })
        const space = await childCareSpaceFactory
          .associations({ fiscalPeriod, category: spacesCategory })
          .create({ monthlyAmount: "700.0000" })
        const cost = await administrationCostFactory
          .associations({ fiscalPeriod, category: administrationCategory })
          .create({ monthlyAmount: "70.0000" })
        const enhancement = await qualityEnhancementFactory
          .associations({ fiscalPeriod, category: qualityCategory })
          .create({ baseMonthlyAmount: "206.1000" })

        await UpdateService.perform(childCareCategory, {
          categoryName: "Renamed cohort",
          fromAge: 4,
          toAge: 8,
        })
        const persistedSpace = await ChildCareSpace.findByPk(space.id, { rejectOnEmpty: true })
        const persistedCost = await AdministrationCost.findByPk(cost.id, { rejectOnEmpty: true })
        const persistedEnhancement = await QualityEnhancement.findByPk(enhancement.id, {
          rejectOnEmpty: true,
        })

        expect([
          {
            id: persistedSpace.id,
            lineName: persistedSpace.lineName,
            monthlyAmount: persistedSpace.monthlyAmount,
          },
          {
            id: persistedCost.id,
            lineName: persistedCost.lineName,
            monthlyAmount: persistedCost.monthlyAmount,
            childCareSpaceCategoryId: persistedCost.childCareSpaceCategoryId,
          },
          {
            id: persistedEnhancement.id,
            lineName: persistedEnhancement.lineName,
            monthlyAmount: persistedEnhancement.monthlyAmount,
            childCareSpaceCategoryId: persistedEnhancement.childCareSpaceCategoryId,
          },
        ]).toEqual([
          { id: space.id, lineName: "Infants", monthlyAmount: "700" },
          {
            id: cost.id,
            lineName: "Infants",
            monthlyAmount: "70",
            childCareSpaceCategoryId: spacesCategory.id,
          },
          {
            id: enhancement.id,
            lineName: "Infants",
            monthlyAmount: "206.1",
            childCareSpaceCategoryId: spacesCategory.id,
          },
        ])
      })
    })
  })
})
