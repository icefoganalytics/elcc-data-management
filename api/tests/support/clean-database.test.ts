import { QueryTypes } from "@sequelize/core"

import db from "@/db/db-client"
import { User } from "@/models"

import { userFactory } from "@/factories"
import cleanDatabase from "@/support/clean-database"

async function getMigrationState() {
  const completedMigrations = await db.query<{ name: string }>(
    "SELECT name FROM knex_migrations ORDER BY id",
    { type: QueryTypes.SELECT }
  )
  const migrationLock = await db.query<{ is_locked: number }>(
    "SELECT is_locked FROM knex_migrations_lock ORDER BY [index]",
    { type: QueryTypes.SELECT }
  )

  return { completedMigrations, migrationLock }
}

describe("api/tests/support/clean-database.ts", () => {
  describe("cleanDatabase", () => {
    test("when application records exist, clears them but preserves migration history and its lock", async () => {
      // Arrange
      const regressionMigrationName = "cleanup-regression.ts"
      await userFactory.create({ email: "cleanup-regression@example.test" })
      await db.query(
        "INSERT INTO knex_migrations (name, batch, migration_time) VALUES (?, 1, GETUTCDATE())",
        { replacements: [regressionMigrationName] }
      )
      const migrationState = await getMigrationState()

      try {
        // Act
        await cleanDatabase()

        // Assert
        const actualMigrationState = await getMigrationState()
        expect({
          applicationUserCount: await User.count(),
          completedMigrations: actualMigrationState.completedMigrations,
          migrationLock: actualMigrationState.migrationLock,
        }).toEqual({
          applicationUserCount: 0,
          completedMigrations: migrationState.completedMigrations,
          migrationLock: [{ is_locked: 0 }],
        })
      } finally {
        await db.query("DELETE FROM knex_migrations WHERE name = ?", {
          replacements: [regressionMigrationName],
        })
      }
    })
  })
})
