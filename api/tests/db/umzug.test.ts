import sequelize from "@/db/db-client"
import { RuntimeAwareSequelizeStorage } from "@/db/umzug"

const storage = new RuntimeAwareSequelizeStorage({ sequelize })
const compiledMigrationName = "test.runtime-aware-sequelize-storage.js"
const sourceMigrationName = "test.runtime-aware-sequelize-storage.ts"

describe("api/src/db/umzug.ts", () => {
  describe("RuntimeAwareSequelizeStorage", () => {
    afterEach(async () => {
      await storage.unlogMigration({ name: sourceMigrationName })
    })

    test("matches a compiled migration ledger entry to its source filename", async () => {
      await storage.logMigration({ name: compiledMigrationName })

      await expect(storage.executed()).resolves.toContain(sourceMigrationName)
    })

    test("removes a compiled migration ledger entry through its source filename", async () => {
      await storage.logMigration({ name: compiledMigrationName })

      await storage.unlogMigration({ name: sourceMigrationName })

      await expect(storage.executed()).resolves.not.toContain(sourceMigrationName)
    })
  })
})
