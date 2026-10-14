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
      await childCareSpaceFactory
        .associations({ centre, fiscalPeriod: aprilFiscalPeriod, category: infantCategory })
        .create({ lineName: "Historical Infant Cohort", monthlyAmount: "125.5000" })

      // Act
      await BulkCreateService.perform(centre, fundingPeriod)
      const childCareSpaces = await ChildCareSpace.findAll()
      const snapshots = childCareSpaces.map((childCareSpace) => {
        const identity = `${childCareSpace.centreId}:${childCareSpace.fiscalPeriodId}:${childCareSpace.categoryId}`
        const { lineName, monthlyAmount } = childCareSpace
        return [identity, { lineName, monthlyAmount }] as const
      })
      const snapshotsByIdentity = new Map(snapshots)

      // Assert
      expect(snapshotsByIdentity).toEqual(
        new Map([
          [
            `${centre.id}:${aprilFiscalPeriod.id}:${infantCategory.id}`,
            { lineName: "Historical Infant Cohort", monthlyAmount: "125.5" },
          ],
          [
            `${centre.id}:${aprilFiscalPeriod.id}:${toddlerCategory.id}`,
            { lineName: "Toddlers", monthlyAmount: "200" },
          ],
          [
            `${centre.id}:${mayFiscalPeriod.id}:${infantCategory.id}`,
            { lineName: "Infants", monthlyAmount: "100" },
          ],
          [
            `${centre.id}:${mayFiscalPeriod.id}:${toddlerCategory.id}`,
            { lineName: "Toddlers", monthlyAmount: "200" },
          ],
        ])
      )
    })
  })
})
