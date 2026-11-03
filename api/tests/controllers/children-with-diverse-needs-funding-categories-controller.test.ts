import { User } from "@/models"

import { fundingPeriodFactory, userFactory } from "@/factories"
import { mockCurrentUser, request } from "@/support"

describe("api/src/controllers/children-with-diverse-needs-funding-categories-controller.ts", () => {
  describe("ChildrenWithDiverseNeedsFundingCategoriesController", () => {
    describe("#create -> POST /api/children-with-diverse-needs-funding-categories", () => {
      test("when an ordinary user creates annual configuration, denies the request", async () => {
        // Arrange
        const currentUser = await userFactory.create({ roles: [User.Roles.USER] })
        mockCurrentUser(currentUser)
        const fundingPeriod = await fundingPeriodFactory.create()

        // Act
        const response = await request()
          .post("/api/children-with-diverse-needs-funding-categories")
          .send({
            fundingPeriodId: fundingPeriod.id,
            categoryName: "Toddlers",
            fromAge: 2,
            toAge: 3,
            monthlyAmount: "54.9600",
          })

        // Assert
        expect(response.status).toEqual(403)
        expect(response.body).toEqual({
          message: "You are not authorized to create categories",
        })
      })
    })
  })
})
