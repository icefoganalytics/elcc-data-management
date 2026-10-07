import { mockCurrentUser, request } from "@/support"
import {
  centreFactory,
  childCareSpaceFactory,
  fiscalPeriodFactory,
  fundingPeriodFactory,
  fundingSubmissionLineFactory,
  userFactory,
} from "@/factories"
import { User } from "@/models"

describe("api/src/controllers/child-care-spaces/replicate-estimates-controller.ts", () => {
  describe("ReplicateEstimatesController", () => {
    describe("#create -> POST /api/child-care-spaces/:childCareSpaceId/replicate-estimates", () => {
      test("when later ledger rows match the source, replicates the estimates and resets actuals", async () => {
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
        const fundingSubmissionLine = await fundingSubmissionLineFactory.create({
          fiscalYear: "2024/25",
          sectionName: "Child Care Spaces",
        })
        const sourceChildCareSpace = await childCareSpaceFactory
          .associations({
            centre,
            fiscalPeriod: aprilFiscalPeriod,
            fundingSubmissionLine,
          })
          .create({
            monthlyAmount: "100.0000",
            estimatedChildOccupancyRate: "0.8000",
            actualChildOccupancyRate: "0.7500",
          })
        const laterChildCareSpace = await childCareSpaceFactory
          .associations({
            centre,
            fiscalPeriod: mayFiscalPeriod,
            fundingSubmissionLine,
          })
          .create({
            monthlyAmount: "100.0000",
            estimatedChildOccupancyRate: "0.1000",
            actualChildOccupancyRate: "0.5000",
          })

        // Act
        const response = await request().post(
          `/api/child-care-spaces/${sourceChildCareSpace.id}/replicate-estimates`
        )
        const persistedLaterChildCareSpace = await laterChildCareSpace.reload()

        // Assert
        // marlens-test-alignment: allow-multiple-expects -- response status, body, and persisted ledger values are independent observable contracts.
        expect(response.status).toBe(201)
        expect(response.body).toEqual({
          message: "Replicated Child Care Spaces estimates to later fiscal periods.",
        })
        expect({
          estimatedChildOccupancyRate: persistedLaterChildCareSpace.estimatedChildOccupancyRate,
          actualChildOccupancyRate: persistedLaterChildCareSpace.actualChildOccupancyRate,
          estimatedComputedTotal: persistedLaterChildCareSpace.estimatedComputedTotal,
          actualComputedTotal: persistedLaterChildCareSpace.actualComputedTotal,
        }).toEqual({
          estimatedChildOccupancyRate: "0.8",
          actualChildOccupancyRate: "0",
          estimatedComputedTotal: "80",
          actualComputedTotal: "0",
        })
      })
    })
  })
})
