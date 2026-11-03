import express from "express"

import { autheticateAndLoadUser } from "@/middleware/authz.middleware"
import auth0Integration from "@/integrations/auth0-integration"
import { UserStatus } from "@/models/user"
import { userFactory } from "@/factories"
import { request } from "@/support"

describe("api/src/middleware/authz.middleware.ts", () => {
  describe("authentication middleware", () => {
    describe("autheticateAndLoadUser", () => {
      test("when a verified identity belongs to an inactive account, returns a stable authorization denial", async () => {
        // Arrange
        const user1 = await userFactory.create({ status: UserStatus.INACTIVE })
        vi.spyOn(auth0Integration, "getUserInfo").mockResolvedValue({
          sub: user1.sub,
          email: user1.email,
          firstName: user1.firstName,
          lastName: user1.lastName,
        })
        const app = express()
        app.use((req, _res, next) => {
          req.user = { sub: user1.sub }
          next()
        })
        app.use(autheticateAndLoadUser)
        app.get("/", (_req, res) => res.status(200).json({ message: "Allowed" }))

        // Act
        const response = await request(undefined, app)
          .get("/")
          .set("Authorization", "Bearer controlled-token")

        // Assert
        expect(response.status).toEqual(403)
        expect(response.body).toEqual({
          message: "Your account is inactive. Contact an administrator.",
        })
      })

      test("when user-info resolves an inactive account, returns authorization denial rather than reauthentication", async () => {
        // Arrange
        const user1 = await userFactory.create({ status: UserStatus.INACTIVE })
        vi.spyOn(auth0Integration, "getUserInfo").mockResolvedValue({
          sub: user1.sub,
          email: user1.email,
          firstName: user1.firstName,
          lastName: user1.lastName,
        })
        const app = express()
        app.use((req, _res, next) => {
          req.user = {}
          next()
        })
        app.use(autheticateAndLoadUser)
        app.get("/", (_req, res) => res.status(200).json({ message: "Allowed" }))

        // Act
        const response = await request(undefined, app)
          .get("/")
          .set("Authorization", "Bearer controlled-token")

        // Assert
        expect(response.status).toEqual(403)
        expect(response.body).toEqual({
          message: "Your account is inactive. Contact an administrator.",
        })
      })

      test("when a verified identity belongs to an active account, allows the protected action", async () => {
        // Arrange
        const user1 = await userFactory.create({ status: UserStatus.ACTIVE })
        const app = express()
        app.use((req, _res, next) => {
          req.user = { sub: user1.sub }
          next()
        })
        app.use(autheticateAndLoadUser)
        app.get("/", (_req, res) => res.status(200).json({ message: "Allowed" }))

        // Act
        const response = await request(undefined, app).get("/")

        // Assert
        expect(response.status).toEqual(200)
        expect(response.body).toEqual({ message: "Allowed" })
      })

      test("when identity-provider authentication fails, retains the authentication-required response", async () => {
        // Arrange
        vi.spyOn(auth0Integration, "getUserInfo").mockRejectedValue(new Error("Session expired"))
        const app = express()
        app.use((req, _res, next) => {
          req.user = {}
          next()
        })
        app.use(autheticateAndLoadUser)
        app.get("/", (_req, res) => res.status(200).json({ message: "Allowed" }))

        // Act
        const response = await request(undefined, app)
          .get("/")
          .set("Authorization", "Bearer controlled-token")

        // Assert
        expect(response.status).toEqual(401)
        expect(response.body).toEqual({
          message: "Failed to get user info: Error: Session expired",
        })
      })
    })
  })
})
