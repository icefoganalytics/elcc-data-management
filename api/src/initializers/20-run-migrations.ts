import sequelize from "@/db/db-client"
import {
  createKnexMigrationClient,
  normalizeKnexMigrationLedger,
} from "@/db/db-migration-client"
import { migrator } from "@/db/umzug"

async function runLegacyMigrations(): Promise<void> {
  const tableNames = await sequelize.queryInterface.listTables()
  const hasLegacyMigrationLedger = tableNames.some(
    ({ tableName }) => tableName === "SequelizeMeta"
  )

  if (!hasLegacyMigrationLedger) {
    console.info("No legacy migration ledger; using the production schema baseline.")
    return
  }

  try {
    const executedMigrations = await migrator.up()

    if (executedMigrations.length === 0) {
      console.info("No pending legacy migrations.")
      return
    }

    console.info("All legacy migrations completed successfully.")
  } catch (error) {
    console.error(`Legacy migration failed: ${error}`, { error })

    const pendingMigrations = await migrator.pending()

    if (pendingMigrations.length > 0) {
      console.error(`Failed legacy migration file: ${pendingMigrations[0].name}`)
    }

    throw error
  }
}

async function runKnexMigrations(): Promise<void> {
  const migrationClient = createKnexMigrationClient()

  try {
    await normalizeKnexMigrationLedger(migrationClient)

    const [_batchNumber, executedMigrations] = await migrationClient.migrate.latest()

    if (executedMigrations.length === 0) {
      console.info("No pending Knex migrations.")
      return
    }

    console.info(`Completed Knex migrations: ${executedMigrations.join(", ")}`)
  } catch (error) {
    console.error(`Knex migration failed: ${error}`, { error })
    throw error
  } finally {
    await migrationClient.destroy()
  }
}

export async function runMigrations(): Promise<void> {
  await runLegacyMigrations()
  await runKnexMigrations()
}

export default runMigrations
