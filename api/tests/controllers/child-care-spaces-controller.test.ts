import { mockCurrentUser, request } from "@/support"
import { childCareSpaceFactory, userFactory } from "@/factories"
import { ChildCareSpace, User } from "@/models"

describe("api/src/controllers/child-care-spaces-controller.ts", () => {
  describe("ChildCareSpacesController", () => {
    describe("#update -> PATCH /api/child-care-spaces/:childCareSpaceId", () => {
      test("when occupancy-rate and protected snapshot updates are provided, persists only the occupancy rates", async () => {
        // Arrange
        const user1 = await userFactory.create({
          roles: [User.Roles.SYSTEM_ADMINISTRATOR],
        })
        mockCurrentUser(user1)

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

        // Assert
        expect({
          status: response.status,
          body: response.body,
        }).toMatchObject({
          status: 200,
          body: {
            childCareSpace: {
              id: childCareSpace.id,
              monthlyAmount: "100",
              estimatedChildOccupancyRate: "0.2500",
              actualChildOccupancyRate: "0.5000",
              estimatedComputedTotal: "25.0000",
              actualComputedTotal: "50.0000",
            },
          },
        })
      })

      test("when occupancy-rate updates are provided, persists them to the ledger", async () => {
        // Arrange
        const user1 = await userFactory.create({
          roles: [User.Roles.SYSTEM_ADMINISTRATOR],
        })
        mockCurrentUser(user1)

        const childCareSpace = await childCareSpaceFactory.create({
          estimatedChildOccupancyRate: "0.1000",
        })

        // Act
        await request()
          .patch(`/api/child-care-spaces/${childCareSpace.id}`)
          .send({ estimatedChildOccupancyRate: "0.2500" })

        // Assert
        await expect(childCareSpace.reload()).resolves.toEqual(
          expect.objectContaining({ estimatedChildOccupancyRate: "0.25" })
        )
      })
    })
  })
})
