import dbMigrationClient from "@/db/db-migration-client"

export async function runMigrations(): Promise<void> {
  try {
    const [_batchNumber, executedMigrations] = await dbMigrationClient.migrate.latest()

    if (executedMigrations.length === 0) {
      console.info("No pending Knex migrations.")
      return
    }

    console.info(`Completed Knex migrations: ${executedMigrations.join(", ")}`)
  } catch (error) {
    console.error(`Knex migration failed: ${error}`, { error })
    throw error
  }
}

export default runMigrations
