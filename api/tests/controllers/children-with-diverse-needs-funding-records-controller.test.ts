import { FiscalPeriod, User } from "@/models"

import {
  centreFactory,
  childrenWithDiverseNeedsFundingCategoryFactory,
  childrenWithDiverseNeedsFundingRecordFactory,
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

    describe("#update -> PATCH /api/children-with-diverse-needs-funding-records/:childrenWithDiverseNeedsFundingRecordId", () => {
      test("when an ordinary user submits snapshot changes, changes only occupancy", async () => {
        // Arrange
        const currentUser = await userFactory.create({ roles: [User.Roles.USER] })
        mockCurrentUser(currentUser)
        const fundingRecord = await childrenWithDiverseNeedsFundingRecordFactory.create({
          lineName: "Historical Support",
          monthlyAmount: "54.9600",
          estimatedChildOccupancyRate: "0.5000",
          actualChildOccupancyRate: "0.2500",
        })

        // Act
        const response = await request()
          .patch(`/api/children-with-diverse-needs-funding-records/${fundingRecord.id}`)
          .send({
            centreId: 99999,
            fiscalPeriodId: 99999,
            categoryId: 99999,
            lineName: "Spoofed Support",
            monthlyAmount: "1.0000",
            estimatedChildOccupancyRate: "0.6250",
          })

        // Assert
        expect(response.status).toEqual(200)
        expect(response.body).toEqual({
          childrenWithDiverseNeedsFundingRecord: {
            id: fundingRecord.id,
            centreId: fundingRecord.centreId,
            fiscalPeriodId: fundingRecord.fiscalPeriodId,
            categoryId: fundingRecord.categoryId,
            lineName: "Historical Support",
            monthlyAmount: "54.9600",
            estimatedChildOccupancyRate: "0.6250",
            actualChildOccupancyRate: "0.2500",
            estimatedComputedTotal: "34.3500",
            actualComputedTotal: "13.7400",
            createdAt: fundingRecord.createdAt.toISOString(),
            updatedAt: expect.any(String),
          },
          policy: { show: true, create: true, update: true, destroy: false },
        })
      })
    })

    describe("#destroy -> DELETE /api/children-with-diverse-needs-funding-records/:childrenWithDiverseNeedsFundingRecordId", () => {
      test("when an ordinary user deletes a monthly record, denies the request", async () => {
        // Arrange
        const currentUser = await userFactory.create({ roles: [User.Roles.USER] })
        mockCurrentUser(currentUser)
        const fundingRecord = await childrenWithDiverseNeedsFundingRecordFactory.create()

        // Act
        const response = await request().delete(
          `/api/children-with-diverse-needs-funding-records/${fundingRecord.id}`
        )

        // Assert
        expect(response.status).toEqual(403)
        expect(response.body).toEqual({
          message:
            "You are not authorized to delete this Children with Diverse Needs funding record",
        })
      })
    })
  })
})
