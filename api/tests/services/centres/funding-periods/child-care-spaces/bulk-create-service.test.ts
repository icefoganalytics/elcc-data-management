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
    test("when category-month pairs are missing, provisions only those pairs and preserves historical snapshots", async () => {
      // Arrange
      const centre = await centreFactory.create()
      const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2024-2025" })
      const april = await fiscalPeriodFactory.create({
        fundingPeriodId: fundingPeriod.id,
        fiscalYear: "2024-25",
        dateStart: new Date("2024-04-01"),
      })
      await fiscalPeriodFactory.create({
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
      const historicalInfant = await childCareSpaceFactory
        .associations({ centre, fiscalPeriod: april, category: infantCategory })
        .create({ lineName: "Historical Infant Cohort", monthlyAmount: "125.5000" })

      // Act
      const created = await BulkCreateService.perform(centre, fundingPeriod)
      const persistedHistoricalInfant = await historicalInfant.reload()
      const allRows = await ChildCareSpace.withScope({
        method: ["byFundingPeriod", fundingPeriod.id],
      }).findAll({
        where: { centreId: centre.id },
        order: [
          ["fiscalPeriodId", "ASC"],
          ["categoryId", "ASC"],
        ],
      })

      // Assert
      // marlens-test-alignment: allow-multiple-expects -- newly provisioned pairs and preserved historical snapshots are independent persisted-state contracts.
      expect(
        created.map(({ fiscalPeriodId, categoryId, lineName, monthlyAmount }) => ({
          fiscalPeriodId,
          categoryId,
          lineName,
          monthlyAmount,
        }))
      ).toEqual([
        expect.objectContaining({
          fiscalPeriodId: april.id,
          categoryId: toddlerCategory.id,
          lineName: "Toddlers",
          monthlyAmount: "200",
        }),
        expect.objectContaining({
          categoryId: infantCategory.id,
          lineName: "Infants",
          monthlyAmount: "100",
        }),
        expect.objectContaining({
          categoryId: toddlerCategory.id,
          lineName: "Toddlers",
          monthlyAmount: "200",
        }),
      ])
      expect(allRows).toHaveLength(4)
      expect(persistedHistoricalInfant).toEqual(
        expect.objectContaining({
          lineName: "Historical Infant Cohort",
          monthlyAmount: "125.5",
        })
      )
    })
  })
})
