import { mockCurrentUser, request } from "@/support"
import { centreFactory, fundingSubmissionLineJsonFactory, userFactory } from "@/factories"
import { ChildCareSpace, FundingSubmissionLineJson, User } from "@/models"

describe("api/src/controllers/funding-submission-line-jsons-controller.ts", () => {
  describe("FundingSubmissionLineJsonsController", () => {
    describe("#create -> POST /api/funding-submission-line-jsons", () => {
      test.each(["lines", "values"] as const)(
        "when a stale client submits Child Care Spaces through %s, rejects the extracted section",
        async (payloadKey) => {
          // Arrange
          const currentUser = await userFactory.create({
            roles: [User.Roles.SYSTEM_ADMINISTRATOR],
          })
          mockCurrentUser(currentUser)
          const centre = await centreFactory.create()
          const staleLine = {
            submissionLineId: 1,
            sectionName: ChildCareSpace.SECTION_NAME,
            lineName: "Infants",
            monthlyAmount: "100",
            estimatedChildOccupancyRate: "0.5",
            actualChildOccupancyRate: "0.5",
            estimatedComputedTotal: "50",
            actualComputedTotal: "50",
          }
          const payload = {
            centreId: centre.id,
            fiscalYear: "2024/25",
            dateName: FundingSubmissionLineJson.Months.APRIL,
            dateStart: "2024-04-01T00:00:00Z",
            dateEnd: "2024-04-30T23:59:59Z",
            [payloadKey]: payloadKey === "lines" ? [staleLine] : JSON.stringify([staleLine]),
          }

          // Act
          const response = await request().post("/api/funding-submission-line-jsons").send(payload)

          // Assert
          // marlens-test-alignment: allow-multiple-expects -- status, error response, and persisted state are independent observable contracts.
          expect(response.status).toBe(422)
          expect(response.body).toEqual({
            message:
              "FundingSubmissionLineJson creation failed: SequelizeValidationError: Validation error: Child Care Spaces values must be written through the Child Care Spaces ledger.",
          })
          await expect(
            FundingSubmissionLineJson.count({ where: { centreId: centre.id } })
          ).resolves.toBe(0)
        }
      )
    })

    describe("#update -> PATCH /api/funding-submission-line-jsons/:fundingSubmissionLineJsonId", () => {
      test.each(["lines", "values"] as const)(
        "when a stale client submits Child Care Spaces through %s, preserves the persisted worksheet",
        async (payloadKey) => {
          // Arrange
          const currentUser = await userFactory.create({
            roles: [User.Roles.SYSTEM_ADMINISTRATOR],
          })
          mockCurrentUser(currentUser)
          const centre = await centreFactory.create()
          const staleLine = {
            submissionLineId: 1,
            sectionName: ChildCareSpace.SECTION_NAME,
            lineName: "Infants",
            monthlyAmount: "100",
            estimatedChildOccupancyRate: "0.5",
            actualChildOccupancyRate: "0.5",
            estimatedComputedTotal: "50",
            actualComputedTotal: "50",
          }
          const remainingLine = { ...staleLine, sectionName: "Administration (10% of Spaces)" }
          const worksheet = await fundingSubmissionLineJsonFactory.create({
            centreId: centre.id,
            lines: [remainingLine],
          })
          const payload = {
            [payloadKey]: payloadKey === "lines" ? [staleLine] : JSON.stringify([staleLine]),
          }

          // Act
          const response = await request()
            .patch(`/api/funding-submission-line-jsons/${worksheet.id}`)
            .send(payload)
          await worksheet.reload()

          // Assert
          // marlens-test-alignment: allow-multiple-expects -- status, error response, and unchanged persisted data are independent observable contracts.
          expect(response.status).toBe(422)
          expect(response.body).toEqual({
            message:
              "FundingSubmissionLineJson update failed: SequelizeValidationError: Validation error: Child Care Spaces values must be written through the Child Care Spaces ledger.",
          })
          expect(worksheet.lines).toEqual([remainingLine])
        }
      )

      test.each(["lines", "values"] as const)(
        "when a client updates JSON-owned sections through %s, persists the accepted values",
        async (payloadKey) => {
          // Arrange
          const currentUser = await userFactory.create({
            roles: [User.Roles.SYSTEM_ADMINISTRATOR],
          })
          mockCurrentUser(currentUser)
          const centre = await centreFactory.create()
          const remainingLine = {
            submissionLineId: 2,
            sectionName: "Administration (10% of Spaces)",
            lineName: "Infants",
            monthlyAmount: "10",
            estimatedChildOccupancyRate: "0.5",
            actualChildOccupancyRate: "0.5",
            estimatedComputedTotal: "5",
            actualComputedTotal: "5",
          }
          const worksheet = await fundingSubmissionLineJsonFactory.create({
            centreId: centre.id,
            fiscalYear: "2024/25",
            dateName: FundingSubmissionLineJson.Months.APRIL,
            dateStart: new Date("2024-04-01T00:00:00Z"),
            dateEnd: new Date("2024-04-30T23:59:59Z"),
            lines: [remainingLine],
          })
          const changedLine = {
            ...remainingLine,
            actualChildOccupancyRate: "0.75",
            actualComputedTotal: "7.5",
          }
          const payload = {
            [payloadKey]: payloadKey === "lines" ? [changedLine] : JSON.stringify([changedLine]),
          }

          // Act
          const response = await request()
            .patch(`/api/funding-submission-line-jsons/${worksheet.id}`)
            .send(payload)
          await worksheet.reload()

          // Assert
          // marlens-test-alignment: allow-multiple-expects -- status, response body, and persisted data are independent observable contracts.
          expect(response.status).toBe(200)
          expect(response.body).toEqual({
            fundingSubmissionLineJson: {
              id: worksheet.id,
              centreId: centre.id,
              fiscalYear: "2024/25",
              dateName: "April",
              dateStart: "2024-04-01T00:00:00.000Z",
              dateEnd: "2024-04-30T23:59:59.000Z",
              createdAt: worksheet.createdAt.toISOString(),
              updatedAt: worksheet.updatedAt.toISOString(),
              deletedAt: null,
              lines: [changedLine],
            },
          })
          expect(worksheet.lines).toEqual([changedLine])
        }
      )
    })
  })
})
