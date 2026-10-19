import {
  centreFactory,
  childCareSpaceCategoryFactory,
  childCareSpaceFactory,
  fiscalPeriodFactory,
  fundingPeriodFactory,
} from "@/factories"
import { ChildCareSpace } from "@/models"

import BulkCreateService from "@/services/centres/funding-periods/child-care-spaces/bulk-create-service"

describe("api/src/services/centres/funding-periods/child-care-spaces/bulk-create-service.ts", () => {
  describe("BulkCreateService", () => {
    describe("#perform", () => {
      test("when category-month pairs are missing, provisions only those pairs and preserves historical snapshots", async () => {
        // Arrange
        const centre = await centreFactory.create()
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2024-2025" })
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
        const infantCategory = await childCareSpaceCategoryFactory.create({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "Infants",
          monthlyAmount: "100.0000",
        })
        const toddlerCategory = await childCareSpaceCategoryFactory.create({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "Toddlers",
          monthlyAmount: "200.0000",
        })
        const historicalInfantChildCareSpace = await childCareSpaceFactory
          .associations({ centre, fiscalPeriod: aprilFiscalPeriod, category: infantCategory })
          .create({ lineName: "Historical Infant Cohort", monthlyAmount: "125.5000" })

        // Act
        await BulkCreateService.perform(centre, fundingPeriod)
        const childCareSpaces = await ChildCareSpace.findAll()

        // Assert
        expect(childCareSpaces).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: historicalInfantChildCareSpace.id,
              centreId: centre.id,
              fiscalPeriodId: aprilFiscalPeriod.id,
              categoryId: infantCategory.id,
              lineName: "Historical Infant Cohort",
              monthlyAmount: "125.5",
            }),
            expect.objectContaining({
              centreId: centre.id,
              fiscalPeriodId: aprilFiscalPeriod.id,
              categoryId: toddlerCategory.id,
              lineName: "Toddlers",
              monthlyAmount: "200",
            }),
            expect.objectContaining({
              centreId: centre.id,
              fiscalPeriodId: mayFiscalPeriod.id,
              categoryId: infantCategory.id,
              lineName: "Infants",
              monthlyAmount: "100",
            }),
            expect.objectContaining({
              centreId: centre.id,
              fiscalPeriodId: mayFiscalPeriod.id,
              categoryId: toddlerCategory.id,
              lineName: "Toddlers",
              monthlyAmount: "200",
            }),
          ])
        )
      })
    })
  })
})
