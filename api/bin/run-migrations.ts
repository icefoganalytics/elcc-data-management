import { runMigrations } from "@/initializers/20-run-migrations"

if (process.argv.length > 2) {
  console.error("The migration pipeline does not accept arguments.")
  process.exit(1)
}

runMigrations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`Migration failed: ${error}`, { error })
    process.exit(1)
  })
