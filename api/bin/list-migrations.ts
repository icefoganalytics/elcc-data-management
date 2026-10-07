import {
  createKnexMigrationClient,
  normalizeKnexMigrationLedger,
} from "@/db/db-migration-client"

if (process.argv.length !== 2) {
  console.error("The Knex list command does not accept arguments.")
  process.exit(1)
}

const migrationClient = createKnexMigrationClient()

async function listMigrations(): Promise<void> {
  try {
    await normalizeKnexMigrationLedger(migrationClient)

    const [completedMigrations, pendingMigrations] = await migrationClient.migrate.list()
    const completedMigrationNames = completedMigrations.map(
      (migration: { name: string }) => migration.name
    )

    const pendingMigrationNames = pendingMigrations.map(
      (migration: { name: string }) => migration.name
    )

    console.info(`Completed Knex migrations: ${completedMigrationNames.join(", ")}`)
    console.info(`Pending Knex migrations: ${pendingMigrationNames.join(", ")}`)
  } finally {
    await migrationClient.destroy()
  }
}

listMigrations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`Knex migration listing failed: ${error}`, { error })
    process.exit(1)
  })
