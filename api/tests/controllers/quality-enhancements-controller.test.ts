import { User } from "@/models"

import {
  centreFactory,
  fiscalPeriodFactory,
  fundingPeriodFactory,
  qualityEnhancementCategoryFactory,
  qualityEnhancementFactory,
  userFactory,
} from "@/factories"
import { mockCurrentUser, request } from "@/support"

describe("api/src/controllers/quality-enhancements-controller.ts", () => {
  describe("QualityEnhancementsController", () => {
    describe("#create -> POST /api/quality-enhancements", () => {
      test("when an authenticated user creates a row, derives snapshots and returns show policy", async () => {
        // Arrange
        const currentUser = await userFactory.create({ roles: [User.Roles.USER] })
        mockCurrentUser(currentUser)
        const centre = await centreFactory.create({ hotMeal: false })
        const fundingPeriod = await fundingPeriodFactory.create()
        const fiscalPeriod = await fiscalPeriodFactory.associations({ fundingPeriod }).create()
        const category = await qualityEnhancementCategoryFactory
          .associations({ fundingPeriod })
          .create({ categoryName: "Infants", monthlyAmount: "206.1000" })

        // Act
        const response = await request().post("/api/quality-enhancements").send({
          centreId: centre.id,
          fiscalPeriodId: fiscalPeriod.id,
          categoryId: category.id,
          estimatedChildOccupancyRate: "0.5000",
          actualChildOccupancyRate: "0.2500",
          lineName: "Untrusted",
          baseMonthlyAmount: "1.0000",
          hotMealIncrementAmount: "99.0000",
          monthlyAmount: "1.0000",
          estimatedComputedTotal: "1.0000",
          actualComputedTotal: "1.0000",
        })

        // Assert
        expect(response.status).toEqual(201)
        expect(response.body).toEqual({
          qualityEnhancement: {
            id: expect.any(Number),
            centreId: centre.id,
            fiscalPeriodId: fiscalPeriod.id,
            categoryId: category.id,
            childCareSpaceCategoryId: null,
            lineName: "Infants",
            baseMonthlyAmount: "206.1",
            hotMealIncrementAmount: "0",
            hotMealAppliedAt: null,
            monthlyAmount: "206.1",
            estimatedChildOccupancyRate: "0.5",
            actualChildOccupancyRate: "0.25",
            estimatedComputedTotal: "103.05",
            actualComputedTotal: "51.525",
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            deletedAt: null,
          },
          policy: { show: true, create: true, update: true, destroy: false },
        })
      })
    })

    describe("#destroy -> DELETE /api/quality-enhancements/:qualityEnhancementId", () => {
      test("when a system administrator deletes a row, responds with no content", async () => {
        // Arrange
        const currentUser = await userFactory.create({ roles: [User.Roles.SYSTEM_ADMINISTRATOR] })
        mockCurrentUser(currentUser)
        const enhancement = await qualityEnhancementFactory.create()

        // Act
        const response = await request().delete(`/api/quality-enhancements/${enhancement.id}`)

        // Assert
        expect(response.status).toEqual(204)
        expect(response.body).toEqual({})
      })

      test("when an ordinary user attempts deletion, responds forbidden", async () => {
        // Arrange
        const currentUser = await userFactory.create({ roles: [User.Roles.USER] })
        mockCurrentUser(currentUser)
        const enhancement = await qualityEnhancementFactory.create()

        // Act
        const response = await request().delete(`/api/quality-enhancements/${enhancement.id}`)

        // Assert
        expect(response.status).toEqual(403)
        expect(response.body).toEqual({
          message: "You are not authorized to delete this Quality Enhancement",
        })
      })
    })

    describe("#update -> PATCH /api/quality-enhancements/:qualityEnhancementId", () => {
      test("when a worksheet user submits snapshot changes with occupancy, saves only occupancy and recalculates totals", async () => {
        // Arrange
        const currentUser = await userFactory.create({ roles: [User.Roles.USER] })
        mockCurrentUser(currentUser)
        const qualityEnhancement = await qualityEnhancementFactory.create({
          baseMonthlyAmount: "100.0000",
          hotMealIncrementAmount: "10.0000",
          estimatedChildOccupancyRate: "0.0000",
          actualChildOccupancyRate: "0.0000",
        })

        // Act
        const response = await request()
          .patch(`/api/quality-enhancements/${qualityEnhancement.id}`)
          .send({
            estimatedChildOccupancyRate: "0.5000",
            actualChildOccupancyRate: "0.2500",
            centreId: 0,
            fiscalPeriodId: 0,
            categoryId: 0,
            childCareSpaceCategoryId: 0,
            lineName: "Untrusted replacement",
            baseMonthlyAmount: "1.0000",
            hotMealIncrementAmount: "1.0000",
            monthlyAmount: "1.0000",
            estimatedComputedTotal: "1.0000",
            actualComputedTotal: "1.0000",
          })

        // Assert
        expect(response.status).toEqual(200)
        expect(response.body).toEqual({
          qualityEnhancement: {
            id: qualityEnhancement.id,
            centreId: qualityEnhancement.centreId,
            fiscalPeriodId: qualityEnhancement.fiscalPeriodId,
            categoryId: qualityEnhancement.categoryId,
            childCareSpaceCategoryId: qualityEnhancement.childCareSpaceCategoryId,
            lineName: qualityEnhancement.lineName,
            baseMonthlyAmount: "100",
            hotMealIncrementAmount: "10",
            hotMealAppliedAt: null,
            monthlyAmount: "110",
            estimatedChildOccupancyRate: "0.5",
            actualChildOccupancyRate: "0.25",
            estimatedComputedTotal: "55",
            actualComputedTotal: "27.5",
            createdAt: qualityEnhancement.createdAt.toISOString(),
            updatedAt: expect.any(String),
            deletedAt: null,
          },
          policy: { show: true, create: true, update: true, destroy: false },
        })
      })
    })
  })
})
