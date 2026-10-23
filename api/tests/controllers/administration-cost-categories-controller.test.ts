import { User } from "@/models"

import { childCareSpaceCategoryFactory, fundingPeriodFactory, userFactory } from "@/factories"
import { mockCurrentUser, request } from "@/support"

describe("api/src/controllers/administration-cost-categories-controller.ts", () => {
  describe("AdministrationCostCategoriesController", () => {
    describe("#create -> POST /api/administration-cost-categories", () => {
      test("when an ordinary user creates annual configuration, denies the request", async () => {
        // Arrange
        const currentUser = await userFactory.create({ roles: [User.Roles.USER] })
        mockCurrentUser(currentUser)
        const fundingPeriod = await fundingPeriodFactory.create()

        // Act
        const response = await request().post("/api/administration-cost-categories").send({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "Infants",
          fromAge: 0,
          toAge: 1,
          monthlyAmount: "80.0000",
        })

        // Assert
        expect(response.status).toEqual(403)
        expect(response.body).toEqual({
          message: "You are not authorized to create administration cost categories",
        })
      })

      test("when a system administrator creates annual configuration, returns its linked category", async () => {
        // Arrange
        const currentUser = await userFactory.create({
          roles: [User.Roles.SYSTEM_ADMINISTRATOR],
        })
        mockCurrentUser(currentUser)
        const fundingPeriod = await fundingPeriodFactory.create()
        const childCareSpaceCategory = await childCareSpaceCategoryFactory
          .associations({ fundingPeriod })
          .create({ categoryName: "Infants" })

        // Act
        const response = await request().post("/api/administration-cost-categories").send({
          fundingPeriodId: fundingPeriod.id,
          childCareSpaceCategoryId: childCareSpaceCategory.id,
          categoryName: "Infants",
          fromAge: 0,
          toAge: 1,
          monthlyAmount: "42.1234",
        })

        // Assert
        expect(response.status).toEqual(201)
        expect(response.body).toEqual({
          administrationCostCategory: {
            id: expect.any(Number),
            fundingPeriodId: fundingPeriod.id,
            childCareSpaceCategoryId: childCareSpaceCategory.id,
            categoryName: "Infants",
            fromAge: 0,
            toAge: 1,
            monthlyAmount: "42.1234",
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            deletedAt: null,
          },
          policy: { show: true, create: true, update: true, destroy: true },
        })
      })
    })
  })
})
