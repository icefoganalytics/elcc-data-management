import { Log } from "@/models"
import { FundingSubmissionLineJsons } from "@/services/centres/funding-periods"

import { centreFactory, userFactory } from "@/factories"

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

      test("when hotMeal changes from false to true, applies hot meal enhancement", async () => {
        // Arrange
        const currentUser = await userFactory.create()
        const centre = await centreFactory.create({
          hotMeal: false,
        })

        const attributes = {
          hotMeal: true,
        }

        const applyHotMealEnhancementSpy = vi.spyOn(
          FundingSubmissionLineJsons.ApplyHotMealEnhancementService,
          "perform"
        ).mockResolvedValue(undefined)

        // Act
        await UpdateService.perform(centre, attributes, currentUser)

        // Assert
        expect(applyHotMealEnhancementSpy).toHaveBeenCalledWith(centre)
      })

      test("when hotMeal changes from true to false, removes hot meal enhancement", async () => {
        // Arrange
        const currentUser = await userFactory.create()
        const centre = await centreFactory.create({
          hotMeal: true,
        })

        const attributes = {
          hotMeal: false,
        }

        const removeHotMealEnhancementSpy = vi.spyOn(
          FundingSubmissionLineJsons.RemoveHotMealEnhancementService,
          "perform"
        ).mockResolvedValue(undefined)

        // Act
        await UpdateService.perform(centre, attributes, currentUser)

        // Assert
        expect(removeHotMealEnhancementSpy).toHaveBeenCalledWith(centre)
      })

      test("when hot meal does not change, does not call apply enhancement service", async () => {
        // Arrange
        const currentUser = await userFactory.create()
        const centre = await centreFactory.create({
          hotMeal: false,
        })

        const attributes = {
          hotMeal: false,
        }

        const applyHotMealEnhancementSpy = vi.spyOn(
          FundingSubmissionLineJsons.ApplyHotMealEnhancementService,
          "perform"
        ).mockResolvedValue(undefined)

        // Act
        await UpdateService.perform(centre, attributes, currentUser)

        // Assert
        expect(applyHotMealEnhancementSpy).not.toHaveBeenCalled()
      })

      test("when hot meal does not change, does not call remove enhancement service", async () => {
        // Arrange
        const currentUser = await userFactory.create()
        const centre = await centreFactory.create({
          hotMeal: false,
        })

        const attributes = {
          hotMeal: false,
        }

        const removeHotMealEnhancementSpy = vi.spyOn(
          FundingSubmissionLineJsons.RemoveHotMealEnhancementService,
          "perform"
        ).mockResolvedValue(undefined)

        // Act
        await UpdateService.perform(centre, attributes, currentUser)

        // Assert
        expect(removeHotMealEnhancementSpy).not.toHaveBeenCalled()
      })
    })
  })
})
