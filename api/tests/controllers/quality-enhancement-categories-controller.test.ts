import childCareCategoryFactory from "@/factories/child-care-category-factory"
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
        const childCareCategory1 = await childCareCategoryFactory.create({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "Infants",
        })
        const response = await request().post("/api/quality-enhancement-categories").send({
          fundingPeriodId: fundingPeriod.id,
          monthlyAmount: "206.1000",
          childCareCategoryId: childCareCategory1.id,
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

    describe("#index -> GET /api/quality-enhancement-categories", () => {
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
        await qualityEnhancementCategoryFactory.create({
          fundingPeriodId: fundingPeriod.id,
          childCareCategoryId: firstChildCareCategory.id,
        })
        const category = await qualityEnhancementCategoryFactory.create({
          fundingPeriodId: fundingPeriod.id,
          childCareCategoryId: secondChildCareCategory.id,
          monthlyAmount: "42.1234",
        })
        await secondChildCareCategory.update({ categoryName: "Cohort Z", fromAge: 7, toAge: 9 })

        // Act
        const response = await request()
          .get("/api/quality-enhancement-categories")
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
          qualityEnhancementCategories: [
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
        await qualityEnhancementCategoryFactory.create({
          fundingPeriodId: fundingPeriod.id,
          childCareCategoryId: childCareCategoryZ.id,
        })
        const category = await qualityEnhancementCategoryFactory.create({
          fundingPeriodId: fundingPeriod.id,
          childCareCategoryId: childCareCategoryA.id,
          monthlyAmount: "42.1234",
        })

        // Act
        const response = await request()
          .get("/api/quality-enhancement-categories")
          .query({
            where: { fundingPeriodId: fundingPeriod.id },
            perPage: 1,
          })

        // Assert
        expect(response.status).toEqual(200)
        expect(response.body).toEqual({
          qualityEnhancementCategories: [
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
        await qualityEnhancementCategoryFactory.create({
          fundingPeriodId: fundingPeriod.id,
          childCareCategoryId: childCareCategoryA.id,
          monthlyAmount: "80.0000",
        })
        const category = await qualityEnhancementCategoryFactory.create({
          fundingPeriodId: fundingPeriod.id,
          childCareCategoryId: childCareCategoryZ.id,
          monthlyAmount: "42.1234",
        })

        // Act
        const response = await request()
          .get("/api/quality-enhancement-categories")
          .query({
            where: { fundingPeriodId: fundingPeriod.id },
            ...order,
            perPage: 1,
          })

        // Assert
        expect(response.status).toEqual(200)
        expect(response.body).toEqual({
          qualityEnhancementCategories: [
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
              policy: { show: true, create: false, update: false, destroy: false },
            },
          ],
          totalCount: 2,
        })
      })
    })
  })
})
