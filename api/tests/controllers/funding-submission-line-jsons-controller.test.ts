import { ChildCareSpace, FundingSubmissionLineJson, User } from "@/models"

import { centreFactory, fundingSubmissionLineJsonFactory, userFactory } from "@/factories"
import { mockCurrentUser, request } from "@/support"

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
          expect(response).toEqual(
            expect.objectContaining({
              status: 422,
              body: expect.objectContaining({
                message: expect.stringContaining("Child Care Spaces"),
              }),
            })
          )
        }
      )

      test.each(["lines", "values"] as const)(
        "when a stale client submits Child Care Spaces through %s, does not create a worksheet",
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
          await request().post("/api/funding-submission-line-jsons").send(payload)
          const worksheets = await FundingSubmissionLineJson.findAll()

          // Assert
          expect(worksheets).toEqual([])
        }
      )

      test("when an administrator writes Administration through worksheet JSON, rejects the write", async () => {
        // Arrange
        const currentUser = await userFactory.create({
          roles: [User.Roles.SYSTEM_ADMINISTRATOR],
        })
        mockCurrentUser(currentUser)
        const centre = await centreFactory.create()
        const administrationLine = {
          submissionLineId: 2,
          sectionName: "Administration (10% of Spaces)",
          lineName: "Infants",
        }

        // Act
        const response = await request()
          .post("/api/funding-submission-line-jsons")
          .send({
            centreId: centre.id,
            fiscalYear: "2024/25",
            dateName: FundingSubmissionLineJson.Months.APRIL,
            dateStart: "2024-04-01T00:00:00Z",
            dateEnd: "2024-04-30T23:59:59Z",
            values: JSON.stringify([administrationLine]),
          })

        // Assert
        expect(response.status).toEqual(422)
        expect(response.body).toEqual({ message: expect.any(String) })
      })
    })

    describe("#update -> PATCH /api/funding-submission-line-jsons/:fundingSubmissionLineJsonId", () => {
      test("when a stale client restores the legacy Administration section, rejects the worksheet update", async () => {
        // Arrange
        const currentUser = await userFactory.create({
          roles: [User.Roles.SYSTEM_ADMINISTRATOR],
        })
        mockCurrentUser(currentUser)
        const centre = await centreFactory.create()
        const worksheet = await fundingSubmissionLineJsonFactory.create({
          centreId: centre.id,
          lines: [],
        })
        const staleLine = {
          submissionLineId: 2,
          sectionName: "Administration",
          lineName: "Infants",
          monthlyAmount: "70.0000",
          actualChildOccupancyRate: "0.2500",
          actualComputedTotal: "17.5000",
        }

        // Act
        const response = await request()
          .patch(`/api/funding-submission-line-jsons/${worksheet.id}`)
          .send({ values: JSON.stringify([staleLine]) })

        // Assert
        expect(response.status).toEqual(422)
        expect(response.body).toEqual({ message: expect.any(String) })
      })

      test.each(["lines", "values"] as const)(
        "when a stale client submits Child Care Spaces through %s, rejects the worksheet update",
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
          const remainingLine = { ...staleLine, sectionName: "Children with Diverse Needs" }
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

          // Assert
          expect(response).toEqual(
            expect.objectContaining({
              status: 422,
              body: expect.objectContaining({
                message: expect.stringContaining("Child Care Spaces"),
              }),
            })
          )
        }
      )

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
          const remainingLine = { ...staleLine, sectionName: "Children with Diverse Needs" }
          const worksheet = await fundingSubmissionLineJsonFactory.create({
            centreId: centre.id,
            lines: [remainingLine],
          })
          const payload = {
            [payloadKey]: payloadKey === "lines" ? [staleLine] : JSON.stringify([staleLine]),
          }

          // Act
          await request().patch(`/api/funding-submission-line-jsons/${worksheet.id}`).send(payload)
          await worksheet.reload()

          // Assert
          expect(worksheet.lines).toEqual([remainingLine])
        }
      )

      test.each(["lines", "values"] as const)(
        "when a client updates JSON-owned sections through %s, returns the accepted worksheet",
        async (payloadKey) => {
          // Arrange
          const currentUser = await userFactory.create({
            roles: [User.Roles.SYSTEM_ADMINISTRATOR],
          })
          mockCurrentUser(currentUser)
          const centre = await centreFactory.create()
          const remainingLine = {
            submissionLineId: 2,
            sectionName: "Children with Diverse Needs",
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

          // Assert
          expect(response).toEqual(
            expect.objectContaining({
              status: 200,
              body: {
                fundingSubmissionLineJson: {
                  id: worksheet.id,
                  centreId: centre.id,
                  fiscalYear: "2024/25",
                  dateName: "April",
                  dateStart: "2024-04-01T00:00:00.000Z",
                  dateEnd: "2024-04-30T23:59:59.000Z",
                  createdAt: worksheet.createdAt.toISOString(),
                  updatedAt: expect.any(String),
                  deletedAt: null,
                  lines: [changedLine],
                },
              },
            })
          )
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
            sectionName: "Children with Diverse Needs",
            lineName: "Infants",
            monthlyAmount: "10",
            estimatedChildOccupancyRate: "0.5",
            actualChildOccupancyRate: "0.5",
            estimatedComputedTotal: "5",
            actualComputedTotal: "5",
          }
          const worksheet = await fundingSubmissionLineJsonFactory.create({
            centreId: centre.id,
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
          await request().patch(`/api/funding-submission-line-jsons/${worksheet.id}`).send(payload)
          await worksheet.reload()

          // Assert
          expect(worksheet.lines).toEqual([changedLine])
        }
      )

      test("when an administrator writes Administration in a worksheet update, preserves the old values", async () => {
        // Arrange
        const currentUser = await userFactory.create({
          roles: [User.Roles.SYSTEM_ADMINISTRATOR],
        })
        mockCurrentUser(currentUser)
        const centre = await centreFactory.create()
        const validLine = {
          submissionLineId: 2,
          sectionName: "Children with Diverse Needs",
          lineName: "Infants",
          monthlyAmount: "10.0000",
          estimatedChildOccupancyRate: "0.5000",
          actualChildOccupancyRate: "0.5000",
          estimatedComputedTotal: "5.0000",
          actualComputedTotal: "5.0000",
        }
        const worksheet = await fundingSubmissionLineJsonFactory.create({
          centreId: centre.id,
          lines: [validLine],
        })
        const administrationLine = {
          ...validLine,
          sectionName: "Administration (10% of Spaces)",
        }

        // Act
        await request()
          .patch(`/api/funding-submission-line-jsons/${worksheet.id}`)
          .send({ values: JSON.stringify([administrationLine]) })

        // Assert
        await worksheet.reload()
        expect(worksheet.lines).toEqual([validLine])
      })
    })
  })
})
