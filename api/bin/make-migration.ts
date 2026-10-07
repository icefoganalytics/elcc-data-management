import {
  createKnexMigrationClient,
  KNEX_MIGRATION_DIRECTORY,
  KNEX_MIGRATION_EXTENSION,
  KNEX_MIGRATION_TEMPLATE,
} from "@/db/db-migration-client"

const migrationName = process.argv[2]

if (process.argv.length !== 3 || !migrationName) {
  console.error("Usage: npm run migrate:make -- <migration-name>")
  process.exit(1)
}

const migrationClient = createKnexMigrationClient()

async function makeMigration(): Promise<void> {
  try {
    const migrationPath = await migrationClient.migrate.make(migrationName, {
      directory: KNEX_MIGRATION_DIRECTORY,
      extension: KNEX_MIGRATION_EXTENSION,
      stub: KNEX_MIGRATION_TEMPLATE,
    })

    console.info(`Created Knex migration: ${migrationPath}`)
  } finally {
    await migrationClient.destroy()
  }
}

makeMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`Failed to create Knex migration: ${error}`, { error })
    process.exit(1)
  })
