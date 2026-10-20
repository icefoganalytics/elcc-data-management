import { User } from "@/models"

import { childCareSpaceCategoryFactory, fundingPeriodFactory, userFactory } from "@/factories"
import { mockCurrentUser, request } from "@/support"

describe("api/src/controllers/child-care-space-categories-controller.ts", () => {
  describe("ChildCareSpaceCategoriesController", () => {
    describe("#create -> POST /api/child-care-space-categories", () => {
      test("when an ordinary user creates shared configuration, denies the request", async () => {
        // Arrange
        const currentUser = await userFactory.create({ roles: [User.Roles.USER] })
        mockCurrentUser(currentUser)
        const fundingPeriod = await fundingPeriodFactory.create()

        // Act
        const response = await request().post("/api/child-care-space-categories").send({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "Infants",
          monthlyAmount: "100.0000",
        })

        // Assert
        expect(response.status).toBe(403)
        expect(response.body).toEqual({
          message: "You are not authorized to create Child Care Space categories",
        })
      })

      test("when a system administrator creates shared configuration, returns the created category", async () => {
        // Arrange
        const currentUser = await userFactory.create({ roles: [User.Roles.SYSTEM_ADMINISTRATOR] })
        mockCurrentUser(currentUser)
        const fundingPeriod = await fundingPeriodFactory.create()

        // Act
        const response = await request().post("/api/child-care-space-categories").send({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "Infants",
          monthlyAmount: "42.1234",
        })

        // Assert
        expect(response.status).toBe(201)
        expect(response.body).toEqual({
          childCareSpaceCategory: {
            id: expect.any(Number),
            fundingPeriodId: fundingPeriod.id,
            categoryName: "Infants",
            fromAge: null,
            toAge: null,
            monthlyAmount: "42.1234",
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            deletedAt: null,
          },
          policy: { show: true, create: true, update: true, destroy: true },
        })
      })
    })

    describe("#update -> PATCH /api/child-care-space-categories/:childCareSpaceCategoryId", () => {
      test("when an ordinary user changes shared rates, denies the request", async () => {
        // Arrange
        const currentUser = await userFactory.create({ roles: [User.Roles.USER] })
        mockCurrentUser(currentUser)
        const category = await childCareSpaceCategoryFactory.create()

        // Act
        const response = await request()
          .patch(`/api/child-care-space-categories/${category.id}`)
          .send({
            monthlyAmount: "200.0000",
            applyToFutureMonths: true,
          })

        // Assert
        expect(response.status).toBe(403)
        expect(response.body).toEqual({
          message: "You are not authorized to update this Child Care Space category",
        })
      })
    })

    describe("#destroy -> DELETE /api/child-care-space-categories/:childCareSpaceCategoryId", () => {
      test("when an ordinary user retires shared configuration, denies the request", async () => {
        // Arrange
        const currentUser = await userFactory.create({ roles: [User.Roles.USER] })
        mockCurrentUser(currentUser)
        const category = await childCareSpaceCategoryFactory.create()

        // Act
        const response = await request().delete(`/api/child-care-space-categories/${category.id}`)

        // Assert
        expect(response.status).toBe(403)
        expect(response.body).toEqual({
          message: "You are not authorized to delete this Child Care Space category",
        })
      })
    })
  })
})
