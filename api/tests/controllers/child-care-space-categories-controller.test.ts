import childCareCategoryFactory from "@/factories/child-care-category-factory"
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
        const childCareCategory1 = await childCareCategoryFactory.create({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "Infants",
        })
        const response = await request().post("/api/child-care-space-categories").send({
          fundingPeriodId: fundingPeriod.id,
          monthlyAmount: "100.0000",
          childCareCategoryId: childCareCategory1.id,
        })

        // Assert
        expect(response.status).toEqual(403)
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
        const childCareCategory2 = await childCareCategoryFactory.create({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "Infants",
        })
        const response = await request().post("/api/child-care-space-categories").send({
          fundingPeriodId: fundingPeriod.id,
          monthlyAmount: "42.1234",
          childCareCategoryId: childCareCategory2.id,
        })

        // Assert
        expect(response.status).toEqual(201)
        expect(response.body).toEqual({
          childCareSpaceCategory: {
            id: expect.any(Number),
            fundingPeriodId: fundingPeriod.id,
            childCareCategoryId: childCareCategory2.id,
            categoryName: "Infants",
            fromAge: 0,
            toAge: 5,
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
        expect(response.status).toEqual(403)
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
        expect(response.status).toEqual(403)
        expect(response.body).toEqual({
          message: "You are not authorized to delete this Child Care Space category",
        })
      })
    })

    describe("#index -> GET /api/child-care-space-categories", () => {
      test("when shared metadata changes, filters, sorts, counts, and pages the projected categories", async () => {
        // Arrange
        const currentUser = await userFactory.create({ roles: [User.Roles.USER] })
        mockCurrentUser(currentUser)
        const fundingPeriod = await fundingPeriodFactory.create()
        const firstChildCareCategory = await childCareCategoryFactory.create({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "Cohort A",
        })
        const secondChildCareCategory = await childCareCategoryFactory.create({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "Cohort B",
        })
        await childCareSpaceCategoryFactory.create({
          fundingPeriodId: fundingPeriod.id,
          childCareCategoryId: firstChildCareCategory.id,
        })
        const category = await childCareSpaceCategoryFactory.create({
          fundingPeriodId: fundingPeriod.id,
          childCareCategoryId: secondChildCareCategory.id,
          monthlyAmount: "42.1234",
        })
        await secondChildCareCategory.update({ categoryName: "Cohort Z", fromAge: 7, toAge: 9 })

        // Act
        const response = await request()
          .get("/api/child-care-space-categories")
          .query({
            where: { fundingPeriodId: fundingPeriod.id },
            filters: { search: "Cohort" },
            "order[0][0]": "childCareCategory",
            "order[0][1]": "categoryName",
            "order[0][2]": "DESC",
            perPage: 1,
            page: 1,
          })

        // Assert
        expect(response.status).toEqual(200)
        expect(response.body).toEqual({
          childCareSpaceCategories: [
            {
              id: category.id,
              fundingPeriodId: fundingPeriod.id,
              childCareCategoryId: secondChildCareCategory.id,
              categoryName: "Cohort Z",
              fromAge: 7,
              toAge: 9,
              monthlyAmount: "42.1234",
              createdAt: category.createdAt.toISOString(),
              updatedAt: category.updatedAt.toISOString(),
              deletedAt: null,
              policy: { show: true, create: false, update: false, destroy: false },
            },
          ],
          totalCount: 2,
        })
      })

      test("when no order is requested, lists categories by shared name ascending", async () => {
        // Arrange
        const currentUser = await userFactory.create({ roles: [User.Roles.USER] })
        mockCurrentUser(currentUser)
        const fundingPeriod = await fundingPeriodFactory.create()
        const childCareCategoryZ = await childCareCategoryFactory.create({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "Cohort Z",
        })
        const childCareCategoryA = await childCareCategoryFactory.create({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "Cohort A",
          fromAge: 3,
          toAge: 5,
        })
        await childCareSpaceCategoryFactory.create({
          fundingPeriodId: fundingPeriod.id,
          childCareCategoryId: childCareCategoryZ.id,
        })
        const category = await childCareSpaceCategoryFactory.create({
          fundingPeriodId: fundingPeriod.id,
          childCareCategoryId: childCareCategoryA.id,
          monthlyAmount: "42.1234",
        })

        // Act
        const response = await request()
          .get("/api/child-care-space-categories")
          .query({
            where: { fundingPeriodId: fundingPeriod.id },
            perPage: 1,
          })

        // Assert
        expect(response.status).toEqual(200)
        expect(response.body).toEqual({
          childCareSpaceCategories: [
            {
              id: category.id,
              fundingPeriodId: fundingPeriod.id,
              childCareCategoryId: childCareCategoryA.id,
              categoryName: "Cohort A",
              fromAge: 3,
              toAge: 5,
              monthlyAmount: "42.1234",
              createdAt: category.createdAt.toISOString(),
              updatedAt: category.updatedAt.toISOString(),
              deletedAt: null,
              policy: { show: true, create: false, update: false, destroy: false },
            },
          ],
          totalCount: 2,
        })
      })

      test.each([
        {
          name: "shared minimum age descending",
          order: {
            "order[0][0]": "childCareCategory",
            "order[0][1]": "fromAge",
            "order[0][2]": "DESC",
          },
        },
        {
          name: "shared maximum age ascending",
          order: {
            "order[0][0]": "childCareCategory",
            "order[0][1]": "toAge",
            "order[0][2]": "ASC",
          },
        },
        {
          name: "local monthly amount ascending",
          order: {
            "order[0][0]": "monthlyAmount",
            "order[0][1]": "ASC",
          },
        },
      ])("when sorted by $name, returns the requested first page", async ({ order }) => {
        // Arrange
        const currentUser = await userFactory.create({ roles: [User.Roles.USER] })
        mockCurrentUser(currentUser)
        const fundingPeriod = await fundingPeriodFactory.create()
        const childCareCategoryA = await childCareCategoryFactory.create({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "Cohort A",
          fromAge: 0,
          toAge: 9,
        })
        const childCareCategoryZ = await childCareCategoryFactory.create({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "Cohort Z",
          fromAge: 3,
          toAge: 5,
        })
        await childCareSpaceCategoryFactory.create({
          fundingPeriodId: fundingPeriod.id,
          childCareCategoryId: childCareCategoryA.id,
          monthlyAmount: "80.0000",
        })
        const category = await childCareSpaceCategoryFactory.create({
          fundingPeriodId: fundingPeriod.id,
          childCareCategoryId: childCareCategoryZ.id,
          monthlyAmount: "42.1234",
        })

        // Act
        const response = await request()
          .get("/api/child-care-space-categories")
          .query({
            where: { fundingPeriodId: fundingPeriod.id },
            ...order,
            perPage: 1,
          })

        // Assert
        expect(response.status).toEqual(200)
        expect(response.body).toEqual({
          childCareSpaceCategories: [
            {
              id: category.id,
              fundingPeriodId: fundingPeriod.id,
              childCareCategoryId: childCareCategoryZ.id,
              categoryName: "Cohort Z",
              fromAge: 3,
              toAge: 5,
              monthlyAmount: "42.1234",
              createdAt: category.createdAt.toISOString(),
              updatedAt: category.updatedAt.toISOString(),
              deletedAt: null,
              policy: { show: true, create: false, update: false, destroy: false },
            },
          ],
          totalCount: 2,
        })
      })
    })
  })
})
