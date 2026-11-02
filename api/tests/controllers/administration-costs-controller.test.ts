import { FiscalPeriod, User } from "@/models"

import {
  administrationCostCategoryFactory,
  administrationCostFactory,
  centreFactory,
  childCareSpaceCategoryFactory,
  fiscalPeriodFactory,
  fundingPeriodFactory,
  userFactory,
} from "@/factories"
import { mockCurrentUser, request } from "@/support"

describe("api/src/controllers/administration-costs-controller.ts", () => {
  describe("AdministrationCostsController", () => {
    describe("#index -> GET /api/administration-costs", () => {
      test("when an ordinary user loads a centre's month without a year filter, returns its ledger rows", async () => {
        // Arrange
        const currentUser = await userFactory.create({
          roles: [User.Roles.USER],
        })
        mockCurrentUser(currentUser)
        const administrationCost = await administrationCostFactory.create({
          lineName: "Infants",
          monthlyAmount: "70.0000",
          estimatedChildOccupancyRate: "0.5000",
          actualChildOccupancyRate: "0.2500",
        })

        // Act
        const response = await request()
          .get("/api/administration-costs")
          .query({
            where: {
              centreId: administrationCost.centreId,
              fiscalPeriodId: administrationCost.fiscalPeriodId,
            },
          })

        // Assert
        expect(response.status).toEqual(200)
        expect(response.body).toEqual({
          administrationCosts: [
            {
              id: administrationCost.id,
              centreId: administrationCost.centreId,
              fiscalPeriodId: administrationCost.fiscalPeriodId,
              categoryId: administrationCost.categoryId,
              childCareSpaceCategoryId: null,
              lineName: "Infants",
              monthlyAmount: "70",
              estimatedChildOccupancyRate: "0.5",
              actualChildOccupancyRate: "0.25",
              estimatedComputedTotal: "35",
              actualComputedTotal: "17.5",
              createdAt: administrationCost.createdAt.toISOString(),
              updatedAt: administrationCost.updatedAt.toISOString(),
              policy: {
                show: true,
                create: true,
                update: true,
                destroy: false,
              },
            },
          ],
          totalCount: 1,
        })
      })

      test("when saved category names differ from configuration order, sorts names alphabetically with stable ties", async () => {
        // Arrange
        const currentUser = await userFactory.create({
          roles: [User.Roles.USER],
        })
        mockCurrentUser(currentUser)
        const centre = await centreFactory.create()
        const otherCentre = await centreFactory.create()
        const fundingPeriod = await fundingPeriodFactory.create({
          fiscalYear: "2024-2025",
        })
        const fiscalPeriod = await fiscalPeriodFactory
          .associations({
            fundingPeriod,
          })
          .create({
            fiscalYear: "2024-25",
            month: FiscalPeriod.Months.APRIL,
            dateStart: new Date("2024-04-01"),
            dateEnd: new Date("2024-04-30"),
          })
        const toddlersCategory = await administrationCostCategoryFactory
          .associations({
            fundingPeriod,
          })
          .create({
            categoryName: "A renamed toddlers category",
          })
        const infantsCategory = await administrationCostCategoryFactory
          .associations({
            fundingPeriod,
          })
          .create({
            categoryName: "Z renamed infants category",
          })
        const preschoolCategory = await administrationCostCategoryFactory
          .associations({
            fundingPeriod,
          })
          .create({
            categoryName: "M renamed preschool category",
          })
        const firstInfantsCost = await administrationCostFactory
          .associations({
            centre: otherCentre,
            fiscalPeriod,
            category: infantsCategory,
          })
          .create({
            lineName: "Infants",
          })
        const toddlersCost = await administrationCostFactory
          .associations({
            centre,
            fiscalPeriod,
            category: toddlersCategory,
          })
          .create({
            lineName: "Toddlers",
          })
        const preschoolCost = await administrationCostFactory
          .associations({
            centre,
            fiscalPeriod,
            category: preschoolCategory,
          })
          .create({
            lineName: "Preschool",
          })
        const secondInfantsCost = await administrationCostFactory
          .associations({
            centre,
            fiscalPeriod,
            category: infantsCategory,
          })
          .create({
            lineName: "Infants",
          })

        // Act
        const response = await request()
          .get("/api/administration-costs")
          .query({
            where: {
              fiscalPeriodId: fiscalPeriod.id,
            },
          })

        // Assert
        expect(response.status).toEqual(200)
        expect(response.body).toEqual({
          administrationCosts: [
            expect.objectContaining({
              id: firstInfantsCost.id,
              lineName: "Infants",
            }),
            expect.objectContaining({
              id: secondInfantsCost.id,
              lineName: "Infants",
            }),
            expect.objectContaining({
              id: preschoolCost.id,
              lineName: "Preschool",
            }),
            expect.objectContaining({
              id: toddlersCost.id,
              lineName: "Toddlers",
            }),
          ],
          totalCount: 4,
        })
      })
    })

    describe("#create -> POST /api/administration-costs", () => {
      test("when an ordinary user adds a category, derives protected snapshots and returns the full record", async () => {
        // Arrange
        const currentUser = await userFactory.create({ roles: [User.Roles.USER] })
        mockCurrentUser(currentUser)
        const centre = await centreFactory.create()
        const fundingPeriod = await fundingPeriodFactory.create()
        const fiscalPeriod = await fiscalPeriodFactory.associations({ fundingPeriod }).create()
        const category = await administrationCostCategoryFactory
          .associations({ fundingPeriod })
          .create({ categoryName: "Administration snapshot", monthlyAmount: "80.0000" })

        // Act
        const response = await request().post("/api/administration-costs").send({
          centreId: centre.id,
          fiscalPeriodId: fiscalPeriod.id,
          categoryId: category.id,
          estimatedChildOccupancyRate: "0.5000",
          actualChildOccupancyRate: "0.2500",
          monthlyAmount: "999.0000",
          lineName: "Untrusted name",
          childCareSpaceCategoryId: 999,
          estimatedComputedTotal: "999.0000",
        })

        // Assert
        expect(response.status).toEqual(201)
        expect(response.body).toEqual({
          administrationCost: {
            id: expect.any(Number),
            centreId: centre.id,
            fiscalPeriodId: fiscalPeriod.id,
            categoryId: category.id,
            childCareSpaceCategoryId: null,
            lineName: "Administration snapshot",
            monthlyAmount: "80",
            estimatedChildOccupancyRate: "0.5",
            actualChildOccupancyRate: "0.25",
            estimatedComputedTotal: "40",
            actualComputedTotal: "20",
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          },
          policy: { show: true, create: true, update: true, destroy: false },
        })
      })

      test("when the category belongs to another funding period, rejects creation", async () => {
        // Arrange
        const currentUser = await userFactory.create({ roles: [User.Roles.USER] })
        mockCurrentUser(currentUser)
        const centre = await centreFactory.create()
        const fiscalPeriod = await fiscalPeriodFactory.create()
        const category = await administrationCostCategoryFactory.create()

        // Act
        const response = await request().post("/api/administration-costs").send({
          centreId: centre.id,
          fiscalPeriodId: fiscalPeriod.id,
          categoryId: category.id,
          estimatedChildOccupancyRate: "0.5000",
          actualChildOccupancyRate: "0.2500",
        })

        // Assert
        expect(response.status).toEqual(422)
        expect(response.body).toEqual({
          message:
            "Error creating administration cost: Error: Administration cost category must be active in the same funding period",
        })
      })
    })

    describe("#destroy -> DELETE /api/administration-costs/:administrationCostId", () => {
      test("when an ordinary user requests deletion, denies access", async () => {
        // Arrange
        const currentUser = await userFactory.create({ roles: [User.Roles.USER] })
        mockCurrentUser(currentUser)
        const cost = await administrationCostFactory.create()

        // Act
        const response = await request().delete(`/api/administration-costs/${cost.id}`)

        // Assert
        expect(response.status).toEqual(403)
        expect(response.body).toEqual({
          message: "You are not authorized to delete this administration cost",
        })
      })

      test("when a system administrator deletes a row, returns no content", async () => {
        // Arrange
        const currentUser = await userFactory.create({ roles: [User.Roles.SYSTEM_ADMINISTRATOR] })
        mockCurrentUser(currentUser)
        const cost = await administrationCostFactory.create()

        // Act
        const response = await request().delete(`/api/administration-costs/${cost.id}`)

        // Assert
        expect(response.status).toEqual(204)
        expect(response.body).toEqual({})
      })
    })

    describe("#update -> PATCH /api/administration-costs/:administrationCostId", () => {
      test("when an ordinary user edits occupancy and protected snapshots, returns only the permitted update", async () => {
        // Arrange
        const currentUser = await userFactory.create({
          roles: [User.Roles.USER],
        })
        mockCurrentUser(currentUser)
        const centre = await centreFactory.create()
        const fundingPeriod = await fundingPeriodFactory.create({
          fiscalYear: "2024-2025",
        })
        const fiscalPeriod = await fiscalPeriodFactory
          .associations({
            fundingPeriod,
          })
          .create({
            fiscalYear: "2024-25",
            dateStart: new Date("2024-04-01"),
          })
        const childCareSpaceCategory = await childCareSpaceCategoryFactory
          .associations({
            fundingPeriod,
          })
          .create({
            categoryName: "Infants",
          })
        const category = await administrationCostCategoryFactory
          .associations({
            fundingPeriod,
            childCareSpaceCategory,
          })
          .create({
            categoryName: "Infants",
            childCareSpaceCategoryId: childCareSpaceCategory.id,
            monthlyAmount: "80.0000",
          })
        const administrationCost = await administrationCostFactory
          .associations({
            centre,
            fiscalPeriod,
            category,
            childCareSpaceCategory,
          })
          .create({
            monthlyAmount: "80.0000",
            estimatedChildOccupancyRate: "0.1000",
            actualChildOccupancyRate: "0.1000",
          })

        // Act
        const response = await request()
          .patch(`/api/administration-costs/${administrationCost.id}`)
          .send({
            estimatedChildOccupancyRate: "0.2500",
            actualChildOccupancyRate: "0.5000",
            monthlyAmount: "999.0000",
            categoryId: 999,
            childCareSpaceCategoryId: null,
            lineName: "Changed label",
          })

        // Assert
        expect(response.status).toEqual(200)
        expect(response.body).toEqual({
          administrationCost: {
            id: administrationCost.id,
            centreId: centre.id,
            fiscalPeriodId: fiscalPeriod.id,
            categoryId: category.id,
            childCareSpaceCategoryId: childCareSpaceCategory.id,
            lineName: "Infants",
            monthlyAmount: "80",
            estimatedChildOccupancyRate: "0.2500",
            actualChildOccupancyRate: "0.5000",
            estimatedComputedTotal: "20.0000",
            actualComputedTotal: "40.0000",
            createdAt: administrationCost.createdAt.toISOString(),
            updatedAt: expect.any(String),
          },
          policy: {
            show: true,
            create: true,
            update: true,
            destroy: false,
          },
        })
      })
    })

    describe("#create -> POST /api/administration-costs/:administrationCostId/replicate-estimates", () => {
      test("when an ordinary user replicates estimates, returns the success response", async () => {
        // Arrange
        const currentUser = await userFactory.create({
          roles: [User.Roles.USER],
        })
        mockCurrentUser(currentUser)
        const centre = await centreFactory.create()
        const fundingPeriod = await fundingPeriodFactory.create({
          fiscalYear: "2024-2025",
        })
        const aprilFiscalPeriod = await fiscalPeriodFactory
          .associations({
            fundingPeriod,
          })
          .create({
            fiscalYear: "2024-25",
            dateStart: new Date("2024-04-01"),
          })
        const mayFiscalPeriod = await fiscalPeriodFactory
          .associations({
            fundingPeriod,
          })
          .create({
            fiscalYear: "2024-25",
            dateStart: new Date("2024-05-01"),
          })
        const category = await administrationCostCategoryFactory
          .associations({
            fundingPeriod,
          })
          .create({
            categoryName: "Infants",
          })
        const sourceAdministrationCost = await administrationCostFactory
          .associations({
            centre,
            fiscalPeriod: aprilFiscalPeriod,
            category,
          })
          .create({
            estimatedChildOccupancyRate: "0.8000",
          })
        await administrationCostFactory
          .associations({
            centre,
            fiscalPeriod: mayFiscalPeriod,
            category,
          })
          .create()

        // Act
        const response = await request().post(
          `/api/administration-costs/${sourceAdministrationCost.id}/replicate-estimates`
        )

        // Assert
        expect(response.status).toEqual(201)
        expect(response.body).toEqual({
          message: "Replicated administration cost estimates to later fiscal periods.",
        })
      })
    })
  })
})
