import { User } from "@/models"

import { qualityEnhancementFactory, userFactory } from "@/factories"
import { mockCurrentUser, request } from "@/support"

describe("api/src/controllers/quality-enhancements-controller.ts", () => {
  describe("QualityEnhancementsController", () => {
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
          qualityEnhancement: expect.objectContaining({
            id: qualityEnhancement.id,
            centreId: qualityEnhancement.centreId,
            fiscalPeriodId: qualityEnhancement.fiscalPeriodId,
            categoryId: qualityEnhancement.categoryId,
            childCareSpaceCategoryId: qualityEnhancement.childCareSpaceCategoryId,
            lineName: qualityEnhancement.lineName,
            baseMonthlyAmount: "100",
            hotMealIncrementAmount: "10",
            monthlyAmount: "110",
            estimatedChildOccupancyRate: "0.5",
            actualChildOccupancyRate: "0.25",
            estimatedComputedTotal: "55",
            actualComputedTotal: "27.5",
          }),
          policy: expect.any(Object),
        })
      })
    })
  })
})
