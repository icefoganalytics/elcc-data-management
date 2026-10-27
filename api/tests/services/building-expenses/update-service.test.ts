import { DateTime } from "luxon"

import { BuildingExpense } from "@/models"

import {
  buildingExpenseFactory,
  fiscalPeriodFactory,
  fundingPeriodFactory,
  userFactory,
} from "@/factories"

import UpdateService from "@/services/building-expenses/update-service"

describe("api/src/services/building-expenses/update-service.ts", () => {
  describe("UpdateService", () => {
    describe(".perform", () => {
      test("when estimated and actual costs are edited, persists the revised amounts and notes", async () => {
        // Arrange
        const fiscalPeriodStart = DateTime.fromISO("2099-04-01T00:00:00Z")
        const currentUser = await userFactory.create()
        const fundingPeriod = await fundingPeriodFactory.create({
          fiscalYear: "2099-2100",
        })
        const fiscalPeriod = await fiscalPeriodFactory.create({
          fundingPeriodId: fundingPeriod.id,
          fiscalYear: "2099-00",
          dateStart: fiscalPeriodStart.toJSDate(),
          dateEnd: fiscalPeriodStart.endOf("month").set({ millisecond: 0 }).toJSDate(),
        })
        const buildingExpense = await buildingExpenseFactory.create({
          fiscalPeriodId: fiscalPeriod.id,
          estimatedCost: "100.0000",
          actualCost: "100.0000",
          totalCost: "50.0000",
          notes: "Before update",
        })

        // Act
        await UpdateService.perform(
          buildingExpense,
          {
            estimatedCost: "125.0000",
            actualCost: "110.0000",
            notes: "After update",
          },
          currentUser
        )

        // Assert
        const persistedBuildingExpense = await BuildingExpense.findByPk(buildingExpense.id, {
          rejectOnEmpty: true,
        })
        expect(persistedBuildingExpense).toEqual(
          expect.objectContaining({
            id: buildingExpense.id,
            estimatedCost: "125",
            actualCost: "110",
            notes: "After update",
          })
        )
      })
    })
  })
})
