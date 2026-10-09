import { mockCurrentUser, request } from "@/support"
import {
  centreFactory,
  childCareSpaceFactory,
  fiscalPeriodFactory,
  fundingPeriodFactory,
  childCareSpaceCategoryFactory,
  userFactory,
} from "@/factories"
import { User } from "@/models"

describe("api/src/controllers/child-care-spaces-controller.ts", () => {
  describe("ChildCareSpacesController", () => {
    describe("#index -> GET /api/child-care-spaces", () => {
      test("when fiscal-period ledger rows exist, returns the requested fiscal year in fiscal-period order", async () => {
        // Arrange
        const currentUser = await userFactory.create({
          roles: [User.Roles.SYSTEM_ADMINISTRATOR],
        })
        mockCurrentUser(currentUser)

        const centre = await centreFactory.create()
        const fundingPeriod = await fundingPeriodFactory.create({
          fiscalYear: "2024-2025",
        })
        const aprilFiscalPeriod = await fiscalPeriodFactory.create({
          fundingPeriodId: fundingPeriod.id,
          fiscalYear: "2024-25",
          dateStart: new Date("2024-04-01"),
        })
        const mayFiscalPeriod = await fiscalPeriodFactory.create({
          fundingPeriodId: fundingPeriod.id,
          fiscalYear: "2024-25",
          dateStart: new Date("2024-05-01"),
        })
        const otherFiscalPeriod = await fiscalPeriodFactory.create({
          fundingPeriodId: fundingPeriod.id,
          fiscalYear: "2025-26",
          dateStart: new Date("2025-04-01"),
        })
        const category = await childCareSpaceCategoryFactory.create({
          fundingPeriodId: fundingPeriod.id,
          categoryName: "Infants",
          monthlyAmount: "100.0000",
        })
        const aprilChildCareSpace = await childCareSpaceFactory
          .associations({
            centre,
            fiscalPeriod: aprilFiscalPeriod,
            category,
          })
          .create({
            monthlyAmount: "100.0000",
            estimatedChildOccupancyRate: "0.5000",
            actualChildOccupancyRate: "0.5000",
          })
        const mayChildCareSpace = await childCareSpaceFactory
          .associations({
            centre,
            fiscalPeriod: mayFiscalPeriod,
            category,
          })
          .create({
            monthlyAmount: "100.0000",
            estimatedChildOccupancyRate: "0.5000",
            actualChildOccupancyRate: "0.2500",
          })
        await childCareSpaceFactory
          .associations({
            centre,
            fiscalPeriod: otherFiscalPeriod,
            category,
          })
          .create({
            monthlyAmount: "100.0000",
            estimatedChildOccupancyRate: "0.5000",
            actualChildOccupancyRate: "0.7500",
          })

        // Act
        const response = await request().get(
          "/api/child-care-spaces?filters%5BbyFiscalYear%5D=2024-25&order%5B0%5D%5B0%5D=fiscalPeriod&order%5B0%5D%5B1%5D=dateStart&order%5B0%5D%5B2%5D=DESC&order%5B1%5D%5B0%5D=categoryId&order%5B1%5D%5B1%5D=ASC&perPage=-1"
        )
        const [persistedMayChildCareSpace, persistedAprilChildCareSpace] = await Promise.all([
          mayChildCareSpace.reload(),
          aprilChildCareSpace.reload(),
        ])

        // Assert
        // marlens-test-alignment: allow-multiple-expects -- status and body are independent observable contracts.
        expect(response.status).toBe(200)
        expect(response.body).toEqual({
          childCareSpaces: [
            {
              id: mayChildCareSpace.id,
              centreId: centre.id,
              fiscalPeriodId: mayFiscalPeriod.id,
              categoryId: category.id,
              lineName: "Infants",
              monthlyAmount: "100",
              estimatedChildOccupancyRate: "0.5",
              actualChildOccupancyRate: "0.25",
              estimatedComputedTotal: "50",
              actualComputedTotal: "25",
              createdAt: persistedMayChildCareSpace.createdAt.toISOString(),
              updatedAt: persistedMayChildCareSpace.updatedAt.toISOString(),
              policy: {
                show: true,
                create: false,
                update: true,
                destroy: false,
              },
            },
            {
              id: aprilChildCareSpace.id,
              centreId: centre.id,
              fiscalPeriodId: aprilFiscalPeriod.id,
              categoryId: category.id,
              lineName: "Infants",
              monthlyAmount: "100",
              estimatedChildOccupancyRate: "0.5",
              actualChildOccupancyRate: "0.5",
              estimatedComputedTotal: "50",
              actualComputedTotal: "50",
              createdAt: persistedAprilChildCareSpace.createdAt.toISOString(),
              updatedAt: persistedAprilChildCareSpace.updatedAt.toISOString(),
              policy: {
                show: true,
                create: false,
                update: true,
                destroy: false,
              },
            },
          ],
          totalCount: 2,
        })
      })
    })

    describe("#update -> PATCH /api/child-care-spaces/:childCareSpaceId", () => {
      test("when occupancy-rate and protected snapshot updates are provided, returns only the permitted update", async () => {
        // Arrange
        const currentUser = await userFactory.create({
          roles: [User.Roles.SYSTEM_ADMINISTRATOR],
        })
        mockCurrentUser(currentUser)

        const childCareSpace = await childCareSpaceFactory.create({
          monthlyAmount: "100.0000",
          estimatedChildOccupancyRate: "0.1000",
          actualChildOccupancyRate: "0.1000",
        })

        // Act
        const response = await request().patch(`/api/child-care-spaces/${childCareSpace.id}`).send({
          monthlyAmount: "999.0000",
          estimatedChildOccupancyRate: "0.2500",
          actualChildOccupancyRate: "0.5000",
        })
        const persistedChildCareSpace = await childCareSpace.reload()

        // Assert
        // marlens-test-alignment: allow-multiple-expects -- status and body are independent observable contracts.
        expect(response.status).toBe(200)
        expect(response.body).toEqual({
          childCareSpace: {
            id: childCareSpace.id,
            centreId: childCareSpace.centreId,
            fiscalPeriodId: childCareSpace.fiscalPeriodId,
            categoryId: childCareSpace.categoryId,
            lineName: childCareSpace.lineName,
            monthlyAmount: "100",
            estimatedChildOccupancyRate: "0.25",
            actualChildOccupancyRate: "0.5",
            estimatedComputedTotal: "25",
            actualComputedTotal: "50",
            createdAt: persistedChildCareSpace.createdAt.toISOString(),
            updatedAt: persistedChildCareSpace.updatedAt.toISOString(),
          },
          policy: {
            show: true,
            create: false,
            update: true,
            destroy: false,
          },
        })
      })

      test("when occupancy-rate updates are provided, persists them to the ledger", async () => {
        // Arrange
        const currentUser = await userFactory.create({
          roles: [User.Roles.SYSTEM_ADMINISTRATOR],
        })
        mockCurrentUser(currentUser)

        const childCareSpace = await childCareSpaceFactory.create({
          estimatedChildOccupancyRate: "0.1000",
        })

        // Act
        const response = await request()
          .patch(`/api/child-care-spaces/${childCareSpace.id}`)
          .send({ estimatedChildOccupancyRate: "0.2500" })
        const persistedChildCareSpace = await childCareSpace.reload()

        // Assert
        // marlens-test-alignment: allow-multiple-expects -- status and persisted ledger values are independent observable contracts.
        expect(response.status).toBe(200)
        expect(persistedChildCareSpace.estimatedChildOccupancyRate).toBe("0.25")
      })
    })
  })
})
