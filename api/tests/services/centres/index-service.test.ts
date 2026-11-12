import { Op } from "@sequelize/core"

import { Centre } from "@/models"
import CentrePolicy from "@/policies/centre-policy"
import IndexService from "@/services/centres/index-service"

import { centreFactory, userFactory } from "@/factories"

describe("api/src/services/centres/index-service.ts", () => {
  describe("IndexService", () => {
    describe("#perform", () => {
      test("when results are paginated, summarizes all matching centres", async () => {
        // Arrange
        const currentUser = await userFactory.create()
        await centreFactory.create({ community: "Whitehorse" })
        await centreFactory.create({ community: "Whitehorse" })
        await centreFactory.create({ community: "Dawson" })

        // Act
        const result = await IndexService.perform({}, [], [["id", "ASC"]], 1, 1, currentUser)

        // Assert
        expect(result).toEqual({
          centres: [expect.any(Centre)],
          totalCount: 3,
          summaries: { communityCount: 2 },
        })
      })

      test("when filters and policy scope exclude centres, excludes them from summaries", async () => {
        // Arrange
        const currentUser = await userFactory.create()
        await centreFactory.create({ community: "Whitehorse", status: Centre.Statuses.ACTIVE })
        await centreFactory.create({ community: "Dawson", status: Centre.Statuses.INACTIVE })
        await centreFactory.create({ community: "Teslin", status: Centre.Statuses.ACTIVE })
        vi.spyOn(CentrePolicy, "applyScope").mockReturnValue(
          Centre.withScope({ where: { community: { [Op.ne]: "Teslin" } } })
        )

        // Act
        const result = await IndexService.perform(
          { status: Centre.Statuses.ACTIVE }, [], [["id", "ASC"]], 1, 0, currentUser
        )

        // Assert
        expect(result).toEqual({
          centres: [expect.objectContaining({ community: "Whitehorse" })],
          totalCount: 1,
          summaries: { communityCount: 1 },
        })
      })

      test("when no centres match, returns zero summaries", async () => {
        // Arrange
        const currentUser = await userFactory.create()
        await centreFactory.create({ community: "Whitehorse" })

        // Act
        const result = await IndexService.perform(
          { community: "Dawson" }, [], [["id", "ASC"]], 1, 0, currentUser
        )

        // Assert
        expect(result).toEqual({ centres: [], totalCount: 0, summaries: { communityCount: 0 } })
      })
    })
  })
})
