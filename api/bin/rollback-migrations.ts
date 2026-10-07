import { NODE_ENV } from "@/config"
import knexMigrationClient from "@/db/db-migration-client"

if (process.argv.length !== 2) {
  console.error("The Knex rollback command does not accept arguments.")
  process.exit(1)
}

if (NODE_ENV === "production") {
  console.error("Knex migrations cannot be rolled back in production.")
  process.exit(1)
}

knexMigrationClient.migrate
  .rollback()
  .then(() => {
    console.info("Rolled back the latest Knex migration batch.")
    process.exit(0)
  })
  .catch((error) => {
    console.error(`Knex migration rollback failed: ${error}`, { error })
    process.exit(1)
  })
