import { FiscalPeriod, User } from "@/models"

import {
  centreFactory,
  childrenWithDiverseNeedsFundingCategoryFactory,
  fiscalPeriodFactory,
  fundingPeriodFactory,
  userFactory,
} from "@/factories"
import { mockCurrentUser, request } from "@/support"

describe("api/src/controllers/children-with-diverse-needs-funding-records-controller.ts", () => {
  describe("ChildrenWithDiverseNeedsFundingRecordsController", () => {
    describe("#create -> POST /api/children-with-diverse-needs-funding-records", () => {
      test("when an ordinary user creates a monthly record, returns its category snapshot and policy", async () => {
        // Arrange
        const currentUser = await userFactory.create({ roles: [User.Roles.USER] })
        mockCurrentUser(currentUser)
        const centre = await centreFactory.create()
        const fundingPeriod = await fundingPeriodFactory.create({
          fiscalYear: "2025-2026",
        })
        const fiscalPeriod = await fiscalPeriodFactory.associations({ fundingPeriod }).create({
          fiscalYear: "2025-26",
          month: FiscalPeriod.Months.APRIL,
          dateStart: new Date("2025-04-01"),
          dateEnd: new Date("2025-04-30"),
        })
        const category = await childrenWithDiverseNeedsFundingCategoryFactory
          .associations({ fundingPeriod })
          .create({ categoryName: "Toddlers", monthlyAmount: "54.9600" })

        // Act
        const response = await request()
          .post("/api/children-with-diverse-needs-funding-records")
          .send({
            centreId: centre.id,
            fiscalPeriodId: fiscalPeriod.id,
            categoryId: category.id,
            estimatedChildOccupancyRate: "0.5000",
            actualChildOccupancyRate: "0.2500",
          })

        // Assert
        expect(response.status).toEqual(201)
        expect(response.body).toEqual({
          childrenWithDiverseNeedsFundingRecord: {
            id: expect.any(Number),
            centreId: centre.id,
            fiscalPeriodId: fiscalPeriod.id,
            categoryId: category.id,
            lineName: "Toddlers",
            monthlyAmount: "54.96",
            estimatedChildOccupancyRate: "0.5",
            actualChildOccupancyRate: "0.25",
            estimatedComputedTotal: "27.48",
            actualComputedTotal: "13.74",
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          },
          policy: { show: true, create: true, update: true, destroy: false },
        })
      })
    })
  })
})
