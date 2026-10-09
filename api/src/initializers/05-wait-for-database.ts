import knex, { type Knex } from "knex"

import { setTimeout } from "timers/promises"

import {
  DB_HEALTH_CHECK_INTERVAL_SECONDS,
  DB_HEALTH_CHECK_RETRIES,
  DB_HEALTH_CHECK_START_PERIOD_SECONDS,
  DB_HEALTH_CHECK_TIMEOUT_SECONDS,
} from "@/config"
import { buildKnexConfig } from "@/db/db-migration-client"
import sleep from "@/utils/sleep"
import { isCredentialFailure, isNetworkFailure, isSocketFailure } from "@/utils/db-error-helpers"

async function checkHealth(dbMigrationClient: Knex, timeoutSeconds: number): Promise<void> {
  const timeoutController = new AbortController()
  const timeout = setTimeout(timeoutSeconds * 1000, undefined, {
    signal: timeoutController.signal,
  })
  const deadline = timeout.then(() => {
    throw new Error("Connection timeout")
  })

  try {
    await Promise.race([dbMigrationClient.raw("SELECT 1"), deadline])
  } finally {
    timeoutController.abort()
  }
}

export async function waitForDatabase({
  intervalSeconds = DB_HEALTH_CHECK_INTERVAL_SECONDS,
  timeoutSeconds = DB_HEALTH_CHECK_TIMEOUT_SECONDS,
  retries = DB_HEALTH_CHECK_RETRIES,
  startPeriodSeconds = DB_HEALTH_CHECK_START_PERIOD_SECONDS,
}: {
  intervalSeconds?: number
  timeoutSeconds?: number
  retries?: number
  startPeriodSeconds?: number
} = {}): Promise<void> {
  await sleep(startPeriodSeconds)

  console.info("Attempting direct to database connection...")
  const timeoutMilliseconds = timeoutSeconds * 1000
  const connectionConfig = {
    connectionTimeout: timeoutMilliseconds,
    requestTimeout: timeoutMilliseconds,
  }
  const databaseConfig = buildKnexConfig({
    acquireConnectionTimeout: timeoutMilliseconds,
    connection: connectionConfig,
  })
  let dbMigrationClient = knex(databaseConfig)
  let isServerLevelConnection = false

  try {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        await checkHealth(dbMigrationClient, timeoutSeconds)
        console.info("Database connection successful.")
        return
      } catch (error) {
        if (isSocketFailure(error)) {
          console.info(`Database socket is not ready, retrying... ${error}`, { error })
          await sleep(intervalSeconds)
          continue
        }

        if (isNetworkFailure(error)) {
          console.info(`Network error, retrying... ${error}`, { error })
          await sleep(intervalSeconds)
          continue
        }

        if (!isCredentialFailure(error)) {
          console.error(`Unknown database connection error: ${error}`, { error })
          throw error
        }

        if (isServerLevelConnection) {
          console.error(`Database connection failed due to invalid credentials: ${error}`, {
            error,
          })
          throw error
        }

        console.info(
          "Falling back to database server-level connection (database might not exist)..."
        )
        await dbMigrationClient.destroy()
        const serverLevelConfig = buildKnexConfig({
          acquireConnectionTimeout: timeoutMilliseconds,
          connection: { ...connectionConfig, database: "" },
        })
        dbMigrationClient = knex(serverLevelConfig)
        isServerLevelConnection = true
        attempt -= 1
      }
    }

    throw new Error("Failed to connect to the database due to timeout.")
  } finally {
    await dbMigrationClient.destroy()
  }
}

export default waitForDatabase
