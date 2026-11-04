import { User } from "@/models"

import {
  childrenWithDiverseNeedsFundingCategoryFactory,
  fundingPeriodFactory,
  userFactory,
} from "@/factories"
import { mockCurrentUser, request } from "@/support"

describe("api/src/controllers/children-with-diverse-needs-funding-categories-controller.ts", () => {
  describe("ChildrenWithDiverseNeedsFundingCategoriesController", () => {
    describe("#index -> GET /api/children-with-diverse-needs-funding-categories", () => {
      test("when a funding period is selected, returns only its active categories with read-only policies", async () => {
        // Arrange
        const currentUser = await userFactory.create({ roles: [User.Roles.USER] })
        mockCurrentUser(currentUser)
        const fundingPeriod = await fundingPeriodFactory.create()
        const category = await childrenWithDiverseNeedsFundingCategoryFactory
          .associations({ fundingPeriod })
          .create({ categoryName: "Additional Support", monthlyAmount: "54.9600" })
        const retiredCategory = await childrenWithDiverseNeedsFundingCategoryFactory
          .associations({ fundingPeriod })
          .create()
        await retiredCategory.destroy()
        await childrenWithDiverseNeedsFundingCategoryFactory.create()

        // Act
        const response = await request()
          .get("/api/children-with-diverse-needs-funding-categories")
          .query({ where: { fundingPeriodId: fundingPeriod.id } })

        // Assert
        expect(response.status).toEqual(200)
        expect(response.body).toEqual({
          childrenWithDiverseNeedsFundingCategories: [
            {
              id: category.id,
              fundingPeriodId: fundingPeriod.id,
              categoryName: "Additional Support",
              fromAge: 2,
              toAge: 3,
              monthlyAmount: "54.96",
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
              policy: { show: true, create: false, update: false, destroy: false },
            },
          ],
          totalCount: 1,
        })
      })
    })

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
          message:
            "You are not authorized to create Children with Diverse Needs funding categories",
        })
      })

      test("when an administrator omits optional ages, returns the category with null age bounds", async () => {
        // Arrange
        const currentUser = await userFactory.create({ roles: [User.Roles.SYSTEM_ADMINISTRATOR] })
        mockCurrentUser(currentUser)
        const fundingPeriod = await fundingPeriodFactory.create()

        // Act
        const response = await request()
          .post("/api/children-with-diverse-needs-funding-categories")
          .send({
            fundingPeriodId: fundingPeriod.id,
            categoryName: "Additional Support",
            monthlyAmount: "54.9600",
          })

        // Assert
        expect(response.status).toEqual(201)
        expect(response.body).toEqual({
          childrenWithDiverseNeedsFundingCategory: {
            id: expect.any(Number),
            fundingPeriodId: fundingPeriod.id,
            categoryName: "Additional Support",
            fromAge: null,
            toAge: null,
            monthlyAmount: "54.96",
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          },
          policy: { show: true, create: true, update: true, destroy: true },
        })
      })
    })
  })
})
