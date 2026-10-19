import supertest from "supertest"

import app from "@/app"

describe("api/src/router.ts", () => {
  describe("authentication boundary", () => {
    test("when no token is provided, allows public status access", async () => {
      // Arrange
      const request = supertest(app)

      // Act
      const response = await request.get("/_status")

      // Assert
      expect(response.status).toEqual(200)
    })

    test("when no token is provided, rejects legacy centre requests", async () => {
      // Arrange
      const request = supertest(app)

      // Act
      const response = await request.get("/api/centre")

      // Assert
      expect(response.status).toEqual(401)
      expect(response.body).toEqual({
        message: "No authorization token was found",
      })
    })

    test("when no token is provided, rejects legacy funding period requests", async () => {
      // Arrange
      const request = supertest(app)

      // Act
      const response = await request.get("/api/funding-period")

      // Assert
      expect(response.status).toEqual(401)
      expect(response.body).toEqual({
        message: "No authorization token was found",
      })
    })

    test("when no token is provided, rejects legacy submission line requests", async () => {
      // Arrange
      const request = supertest(app)

      // Act
      const response = await request.get("/api/submission-line")

      // Assert
      expect(response.status).toEqual(401)
      expect(response.body).toEqual({
        message: "No authorization token was found",
      })
    })

    test("when no token is provided, rejects modern API requests", async () => {
      // Arrange
      const request = supertest(app)

      // Act
      const response = await request.get("/api/current-user")

      // Assert
      expect(response.status).toEqual(401)
      expect(response.body).toEqual({
        message: "No authorization token was found",
      })
    })

    test("when no token is provided, rejects unknown API writes before routing", async () => {
      // Arrange
      const request = supertest(app)

      // Act
      const response = await request.post("/api/unknown-authentication-test").send({})

      // Assert
      expect(response.status).toEqual(401)
      expect(response.body).toEqual({
        message: "No authorization token was found",
      })
    })

    test("when a malformed token is provided, rejects API requests", async () => {
      // Arrange
      const request = supertest(app)

      // Act
      const response = await request.get("/api/centre").set("Authorization", "Bearer invalid-token")

      // Assert
      expect(response.status).toEqual(401)
      expect(response.body).toEqual({
        message: "jwt malformed",
      })
    })
  })
})
