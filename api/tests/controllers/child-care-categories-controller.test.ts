import { User } from "@/models"
import { childCareCategoryFactory, fundingPeriodFactory, userFactory } from "@/factories"
import { mockCurrentUser, request } from "@/support"

describe("api/src/controllers/child-care-categories-controller.ts", () => {
  describe("ChildCareCategoriesController", () => {
    describe("#create -> POST /api/child-care-categories", () => {
      test("system administrators create shared metadata without program rates", async () => {
        const currentUser = await userFactory.create({ roles: [User.Roles.SYSTEM_ADMINISTRATOR] })
        mockCurrentUser(currentUser)
        const fundingPeriod = await fundingPeriodFactory.create()

        const response = await request().post("/api/child-care-categories").send({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "Shared cohort",
          fromAge: 4,
          toAge: 8,
          monthlyAmount: "999.0000",
        })

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

      test("ordinary users cannot create shared metadata", async () => {
        const currentUser = await userFactory.create({ roles: [User.Roles.USER] })
        mockCurrentUser(currentUser)

        const response = await request()
          .post("/api/child-care-categories")
          .send({ categoryName: "Shared cohort" })

        expect(response.status).toEqual(403)
        expect(response.body).toEqual({
          message: "You are not authorized to create Child Care categories",
        })
      })
    })

    describe("#show -> GET /api/child-care-categories/:childCareCategoryId", () => {
      test("authenticated users can read shared metadata with read-only policy", async () => {
        const currentUser = await userFactory.create({ roles: [User.Roles.USER] })
        mockCurrentUser(currentUser)
        const category = await childCareCategoryFactory.create({
          categoryName: "Shared cohort",
          fromAge: 4,
          toAge: 8,
        })

        const response = await request().get(`/api/child-care-categories/${category.id}`)

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
