import knex, { type Knex } from "knex"

import { DB_NAME } from "@/config"
import { buildKnexConfig } from "@/db/db-migration-client"
import { isCredentialFailure } from "@/utils/db-error-helpers"

async function databaseExists(dbMigrationClient: Knex, databaseName: string): Promise<boolean> {
  const result = await dbMigrationClient.raw<unknown[]>(
    "SELECT 1 FROM sys.databases WHERE name = ?",
    [databaseName]
  )

  return result.length > 0
}

async function ensureDatabase(): Promise<true> {
  console.info("Attempting direct to database connection to determine if database exists...")
  const databaseConfig = buildKnexConfig()
  let dbMigrationClient = knex(databaseConfig)

  try {
    try {
      if (await databaseExists(dbMigrationClient, DB_NAME)) {
        return true
      }
    } catch (error) {
      if (!isCredentialFailure(error)) {
        console.error(`Could not determine if database exists: ${error}`, { error })
        throw error
      }

      console.info("Attempting server-level connection to determine if database exists...")
      await dbMigrationClient.destroy()
      const serverLevelConfig = buildKnexConfig({ connection: { database: "" } })
      dbMigrationClient = knex(serverLevelConfig)

      if (await databaseExists(dbMigrationClient, DB_NAME)) {
        return true
      }
    }

    console.info(`Database ${DB_NAME} does not exist: creating...`)
    await dbMigrationClient.raw("CREATE DATABASE ??", [DB_NAME])
    return true
  } finally {
    await dbMigrationClient.destroy()
  }
}

export default ensureDatabase
