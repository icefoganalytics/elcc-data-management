import { User } from "@/models"
import { centreFactory, userFactory } from "@/factories"
import { mockCurrentUser, request } from "@/support"

describe("api/src/controllers/centres-controller.ts", () => {
  describe("CentresController", () => {
    describe("#update -> PATCH /api/centres/:centreId", () => {
      test("when a System Administrator updates a centre, persists the edited metadata", async () => {
        // Arrange
        const currentUser = await userFactory.asSystemAdministrator().create()
        mockCurrentUser(currentUser)
        const centre = await centreFactory.create({ name: "Original Centre" })

        // Act
        await request().patch(`/api/centres/${centre.id}`).send({ name: "Updated Centre" })
        await centre.reload()

        // Assert
        expect(centre.name).toEqual("Updated Centre")
      })

      test.each([User.Roles.USER, User.Roles.EDITOR, User.Roles.ADMIN, User.Roles.SUPER_ADMIN])(
        "when the user has only the %s role, rejects direct centre updates",
        async (role) => {
          // Arrange
          const currentUser = await userFactory.create({ roles: [role] })
          mockCurrentUser(currentUser)
          const centre = await centreFactory.create()

          // Act
          const response = await request()
            .patch(`/api/centres/${centre.id}`)
            .send({ name: "Unauthorized change" })

          // Assert
          expect(response.status).toEqual(403)
          expect(response.body).toEqual({
            message: "You are not authorized to update this centre",
          })
        }
      )

      test("when an Editor attempts an update, preserves the centre metadata", async () => {
        // Arrange
        const currentUser = await userFactory.create({ roles: [User.Roles.EDITOR] })
        mockCurrentUser(currentUser)
        const centre = await centreFactory.create({ name: "Original Centre" })

        // Act
        await request().patch(`/api/centres/${centre.id}`).send({ name: "Unauthorized change" })
        await centre.reload()

        // Assert
        expect(centre.name).toEqual("Original Centre")
      })
    })
  })
})
