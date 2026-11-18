import { User } from "@/models"
import { childCareCategoryFactory, fundingPeriodFactory, userFactory } from "@/factories"
import { mockCurrentUser, request } from "@/support"

describe("api/src/controllers/child-care-categories-controller.ts", () => {
  describe("ChildCareCategoriesController", () => {
    describe("#create -> POST /api/child-care-categories", () => {
      test("when a system administrator creates a category, returns shared metadata without program rates", async () => {
        // Arrange
        const currentUser = await userFactory.create({ roles: [User.Roles.SYSTEM_ADMINISTRATOR] })
        mockCurrentUser(currentUser)
        const fundingPeriod = await fundingPeriodFactory.create()

        // Act
        const response = await request().post("/api/child-care-categories").send({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "Shared cohort",
          fromAge: 4,
          toAge: 8,
          monthlyAmount: "999.0000",
        })

        // Assert
        expect(response.status).toEqual(201)
        expect(response.body).toEqual({
          childCareCategory: {
            id: expect.any(Number),
            fundingPeriodId: fundingPeriod.id,
            categoryName: "Shared cohort",
            fromAge: 4,
            toAge: 8,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          },
          policy: { show: true, create: true, update: true, destroy: true },
        })
      })

      test("when an ordinary user creates a category, denies access", async () => {
        // Arrange
        const currentUser = await userFactory.create({ roles: [User.Roles.USER] })
        mockCurrentUser(currentUser)

        // Act
        const response = await request()
          .post("/api/child-care-categories")
          .send({ categoryName: "Shared cohort" })

        // Assert
        expect(response.status).toEqual(403)
        expect(response.body).toEqual({
          message: "You are not authorized to create Child Care categories",
        })
      })
    })

    describe("#update -> PATCH /api/child-care-categories/:childCareCategoryId", () => {
      test("when an update includes another funding period, updates metadata without moving the category", async () => {
        // Arrange
        const currentUser = await userFactory.create({ roles: [User.Roles.SYSTEM_ADMINISTRATOR] })
        mockCurrentUser(currentUser)
        const category = await childCareCategoryFactory.create({
          categoryName: "Shared cohort",
          fromAge: 4,
          toAge: 8,
        })
        const fundingPeriod = await fundingPeriodFactory.create()

        // Act
        const response = await request().patch(`/api/child-care-categories/${category.id}`).send({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "Updated cohort",
          fromAge: 5,
          toAge: 9,
        })

        // Assert
        expect(response.status).toEqual(200)
        expect(response.body).toEqual({
          childCareCategory: {
            id: category.id,
            fundingPeriodId: category.fundingPeriodId,
            categoryName: "Updated cohort",
            fromAge: 5,
            toAge: 9,
            createdAt: category.createdAt.toISOString(),
            updatedAt: expect.any(String),
          },
          policy: {
            show: true,
            create: true,
            update: true,
            destroy: true,
          },
        })
      })
    })

    describe("#show -> GET /api/child-care-categories/:childCareCategoryId", () => {
      test("when an authenticated user reads a category, returns shared metadata with read-only policy", async () => {
        // Arrange
        const currentUser = await userFactory.create({ roles: [User.Roles.USER] })
        mockCurrentUser(currentUser)
        const category = await childCareCategoryFactory.create({
          categoryName: "Shared cohort",
          fromAge: 4,
          toAge: 8,
        })

        // Act
        const response = await request().get(`/api/child-care-categories/${category.id}`)

        // Assert
        expect(response.status).toEqual(200)
        expect(response.body).toEqual({
          childCareCategory: {
            id: category.id,
            fundingPeriodId: category.fundingPeriodId,
            categoryName: "Shared cohort",
            fromAge: 4,
            toAge: 8,
            createdAt: category.createdAt.toISOString(),
            updatedAt: category.updatedAt.toISOString(),
          },
          policy: { show: true, create: false, update: false, destroy: false },
        })
      })
    })
  })
})
