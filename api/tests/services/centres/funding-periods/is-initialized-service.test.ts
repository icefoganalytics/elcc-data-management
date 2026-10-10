import {
  centreFactory,
  childCareSpaceCategoryFactory,
  childCareSpaceFactory,
  fiscalPeriodFactory,
  fundingPeriodFactory,
} from "@/factories"

import IsInitializedService from "@/services/centres/funding-periods/is-initialized-service"

describe("api/src/services/centres/funding-periods/is-initialized-service.ts", () => {
  describe("IsInitializedService", () => {
    describe("#perform", () => {
      test("when only some Child Care Space category and fiscal-period pairs exist, reports Child Care Spaces as uninitialized", async () => {
        // Arrange
        const centre = await centreFactory.create()
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2024-2025" })
        const aprilFiscalPeriod = await fiscalPeriodFactory.create({
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
        })
        await childCareSpaceCategoryFactory.create({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "Toddlers",
        })
        await childCareSpaceFactory
          .associations({
            centre,
            fiscalPeriod: aprilFiscalPeriod,
            category: infantCategory,
          })
          .create()

        // Act
        const initializationStatus = await IsInitializedService.perform(centre, fundingPeriod)

        // Assert
        expect(initializationStatus.hasChildCareSpaces).toBe(false)
      })

      test("when a Child Care Space category is soft-deleted, its historical ledger row does not prevent initialization", async () => {
        // Arrange
        const centre = await centreFactory.create()
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2024-2025" })
        const fiscalPeriod = await fiscalPeriodFactory.create({
          fundingPeriodId: fundingPeriod.id,
          fiscalYear: "2024-25",
          dateStart: new Date("2024-04-01"),
        })
        const infantCategory = await childCareSpaceCategoryFactory.create({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "Infants",
        })
        const toddlerCategory = await childCareSpaceCategoryFactory.create({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "Toddlers",
        })
        await childCareSpaceFactory
          .associations({ centre, fiscalPeriod, category: infantCategory })
          .create()
        await childCareSpaceFactory
          .associations({ centre, fiscalPeriod, category: toddlerCategory })
          .create()
        await toddlerCategory.destroy()

        // Act
        const initializationStatus = await IsInitializedService.perform(centre, fundingPeriod)

        // Assert
        expect(initializationStatus).toMatchObject({ hasChildCareSpaces: true })
      })

      test("when all Child Care Space categories are soft-deleted, the empty expected set is complete", async () => {
        // Arrange
        const centre = await centreFactory.create()
        const fundingPeriod = await fundingPeriodFactory.create({ fiscalYear: "2024-2025" })
        await fiscalPeriodFactory.create({
          fundingPeriodId: fundingPeriod.id,
          fiscalYear: "2024-25",
          dateStart: new Date("2024-04-01"),
        })
        const infantCategory = await childCareSpaceCategoryFactory.create({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "Infants",
        })
        const toddlerCategory = await childCareSpaceCategoryFactory.create({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "Toddlers",
        })
        await infantCategory.destroy()
        await toddlerCategory.destroy()

        // Act
        const initializationStatus = await IsInitializedService.perform(centre, fundingPeriod)

        // Assert
        expect(initializationStatus).toMatchObject({ hasChildCareSpaces: true })
      })
    })
  })
})
