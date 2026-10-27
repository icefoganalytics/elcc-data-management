import { mockCurrentUser, request } from "@/support"
import { userFactory } from "@/factories"
import { User } from "@/models"

describe("api/src/controllers/users-controller.ts", () => {
  describe("UsersController", () => {
    describe("#index -> GET /api/users", () => {
      test("when users exist, returns the requested users and total count", async () => {
        // Arrange
        const currentUser = await userFactory.create({
          roles: [User.Roles.SYSTEM_ADMINISTRATOR],
        })
        mockCurrentUser(currentUser)
        const user1 = await userFactory.create()
        const user2 = await userFactory.create()

        // Act
        const response = await request().get("/api/users?order[0][0]=id&order[0][1]=ASC")

        // Assert
        expect(response.status).toEqual(200)
        expect(response.body).toEqual({
          users: [
            {
              id: currentUser.id,
              email: currentUser.email,
              firstName: currentUser.firstName,
              lastName: currentUser.lastName,
              displayName: currentUser.displayName,
              roles: currentUser.roles,
              status: currentUser.status,
              createdAt: currentUser.createdAt.toISOString(),
              updatedAt: currentUser.updatedAt.toISOString(),
            },
            {
              id: user1.id,
              email: user1.email,
              firstName: user1.firstName,
              lastName: user1.lastName,
              displayName: user1.displayName,
              roles: user1.roles,
              status: user1.status,
              createdAt: user1.createdAt.toISOString(),
              updatedAt: user1.updatedAt.toISOString(),
            },
            {
              id: user2.id,
              email: user2.email,
              firstName: user2.firstName,
              lastName: user2.lastName,
              displayName: user2.displayName,
              roles: user2.roles,
              status: user2.status,
              createdAt: user2.createdAt.toISOString(),
              updatedAt: user2.updatedAt.toISOString(),
            },
          ],
          totalCount: 3,
        })
      })
    })

    describe("#show -> GET /api/users/:userId", () => {
      test("when user exists, returns a specific user", async () => {
        // Arrange
        const currentUser = await userFactory.create({ roles: [User.Roles.SYSTEM_ADMINISTRATOR] })
        mockCurrentUser(currentUser)
        const user = await userFactory.create()

        // Act
        const response = await request().get(`/api/users/${user.id}`)

        // Assert
        expect(response.status).toEqual(200)
        expect(response.body).toEqual({
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            displayName: user.displayName,
            roles: user.roles,
            status: user.status,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
          },
          policy: { show: true, create: true, update: true, destroy: true },
        })
      })

      test("when user does not exist, returns 404", async () => {
        // Arrange
        const currentUser = await userFactory.create({ roles: [User.Roles.SYSTEM_ADMINISTRATOR] })
        mockCurrentUser(currentUser)

        // Act
        const response = await request().get("/api/users/999999")

        // Assert
        expect(response.status).toEqual(404)
        expect(response.body).toEqual({ message: "User not found" })
      })
    })

    describe("#create -> POST /api/users", () => {
      test("when valid data is provided, returns the created user", async () => {
        // Arrange
        const currentUser = await userFactory.create({ roles: [User.Roles.SYSTEM_ADMINISTRATOR] })
        mockCurrentUser(currentUser)
        const userData = {
          email: "newuser@example.com",
          firstName: "New",
          lastName: "User",
          roles: [User.Roles.USER],
          status: User.Status.ACTIVE,
        }

        // Act
        const response = await request().post("/api/users").send(userData)

        // Assert
        expect(response.status).toEqual(201)
        expect(response.body).toEqual({
          user: {
            id: expect.any(Number),
            ...userData,
            displayName: "New User",
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          },
          policy: { show: true, create: true, update: true, destroy: true },
        })
      })

      test("when valid data is provided, persists the user to the database", async () => {
        // Arrange
        const currentUser = await userFactory.create({ roles: [User.Roles.SYSTEM_ADMINISTRATOR] })
        mockCurrentUser(currentUser)
        const userData = {
          email: "anotheruser@example.com",
          firstName: "Another",
          lastName: "User",
          roles: [User.Roles.USER],
          status: User.Status.ACTIVE,
        }

        // Act
        await request().post("/api/users").send(userData).expect(201)

        // Assert
        const user = await User.findOne({ where: { email: userData.email } })
        expect(user).toEqual(expect.objectContaining(userData))
      })
    })

    describe("#update -> PATCH /api/users/:userId", () => {
      test("when valid updates are provided, returns the updated user", async () => {
        // Arrange
        const currentUser = await userFactory.create({ roles: [User.Roles.SYSTEM_ADMINISTRATOR] })
        mockCurrentUser(currentUser)
        const user = await userFactory.create()
        const updates = { firstName: "Updated", lastName: "Name" }

        // Act
        const response = await request().patch(`/api/users/${user.id}`).send(updates)

        // Assert
        expect(response.status).toEqual(200)
        expect(response.body).toEqual({
          user: expect.objectContaining({
            id: user.id,
            email: user.email,
            ...updates,
            displayName: "Updated Name",
            roles: user.roles,
            status: user.status,
            createdAt: user.createdAt.toISOString(),
          }),
          policy: { show: true, create: true, update: true, destroy: true },
        })
      })

      test("when valid updates are provided, persists the updates to the database", async () => {
        // Arrange
        const currentUser = await userFactory.create({ roles: [User.Roles.SYSTEM_ADMINISTRATOR] })
        mockCurrentUser(currentUser)
        const user = await userFactory.create()
        const updates = { firstName: "Updated", lastName: "Name" }

        // Act
        await request().patch(`/api/users/${user.id}`).send(updates).expect(200)

        // Assert
        await user.reload()
        expect(user).toEqual(expect.objectContaining(updates))
      })

      test("when user does not exist, returns 404", async () => {
        // Arrange
        const currentUser = await userFactory.create({ roles: [User.Roles.SYSTEM_ADMINISTRATOR] })
        mockCurrentUser(currentUser)

        // Act
        const response = await request().patch("/api/users/999999").send({ firstName: "Test" })

        // Assert
        expect(response.status).toEqual(404)
        expect(response.body).toEqual({ message: "User not found" })
      })
    })

    describe("#destroy -> DELETE /api/users/:userId", () => {
      test("when user exists, returns 204 status", async () => {
        // Arrange
        const currentUser = await userFactory.create({ roles: [User.Roles.SYSTEM_ADMINISTRATOR] })
        mockCurrentUser(currentUser)
        const user = await userFactory.create()

        // Act
        const response = await request().delete(`/api/users/${user.id}`)

        // Assert
        expect(response.status).toEqual(204)
        expect(response.body).toEqual({})
      })

      test("when user exists, removes user from database", async () => {
        // Arrange
        const currentUser = await userFactory.create({ roles: [User.Roles.SYSTEM_ADMINISTRATOR] })
        mockCurrentUser(currentUser)
        const user = await userFactory.create()

        // Act
        await request().delete(`/api/users/${user.id}`).expect(204)

        // Assert
        expect(await User.findByPk(user.id)).toBeNull()
      })

      test("when user does not exist, returns 404", async () => {
        // Arrange
        const currentUser = await userFactory.create({ roles: [User.Roles.SYSTEM_ADMINISTRATOR] })
        mockCurrentUser(currentUser)

        // Act
        const response = await request().delete("/api/users/999999")

        // Assert
        expect(response.status).toEqual(404)
        expect(response.body).toEqual({ message: "User not found" })
      })
    })
  })
})
