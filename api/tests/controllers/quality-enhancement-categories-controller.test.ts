import { User } from "@/models"

import { fundingPeriodFactory, qualityEnhancementCategoryFactory, userFactory } from "@/factories"
import { mockCurrentUser, request } from "@/support"

describe("api/src/controllers/quality-enhancement-categories-controller.ts", () => {
  describe("QualityEnhancementCategoriesController", () => {
    describe("#create -> POST /api/quality-enhancement-categories", () => {
      test("when an ordinary user creates shared configuration, denies access", async () => {
        // Arrange
        const currentUser = await userFactory.create({ roles: [User.Roles.USER] })
        mockCurrentUser(currentUser)
        const fundingPeriod = await fundingPeriodFactory.create()

        // Act
        const response = await request().post("/api/quality-enhancement-categories").send({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "Infants",
          monthlyAmount: "206.1000",
        })

        // Assert
        expect(response.status).toEqual(403)
        expect(response.body).toEqual({
          message: "You are not authorized to create Quality Enhancement categories",
        })
      })
    })

    describe("#update -> PATCH /api/quality-enhancement-categories/:qualityEnhancementCategoryId", () => {
      test("when an ordinary user updates shared configuration, denies access", async () => {
        // Arrange
        const currentUser = await userFactory.create({ roles: [User.Roles.USER] })
        mockCurrentUser(currentUser)
        const category = await qualityEnhancementCategoryFactory.create()

        // Act
        const response = await request()
          .patch(`/api/quality-enhancement-categories/${category.id}`)
          .send({ monthlyAmount: "1.0000" })

        // Assert
        expect(response.status).toEqual(403)
        expect(response.body).toEqual({
          message: "You are not authorized to update this Quality Enhancement category",
        })
      })
    })
  })
})
