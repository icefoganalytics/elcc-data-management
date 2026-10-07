import knexMigrationClient from "@/db/db-migration-client"

if (process.argv.length !== 2) {
  console.error("The Knex list command does not accept arguments.")
  process.exit(1)
}

knexMigrationClient.migrate
  .list()
  .then(([completedMigrations, pendingMigrations]) => {
    const completedMigrationNames = completedMigrations.map(({ name }) => name)

    console.info(`Completed Knex migrations: ${completedMigrationNames.join(", ")}`)
    console.info(`Pending Knex migrations: ${pendingMigrations.join(", ")}`)
    process.exit(0)
  })
  .catch((error) => {
    console.error(`Knex migration listing failed: ${error}`, { error })
    process.exit(1)
  })
