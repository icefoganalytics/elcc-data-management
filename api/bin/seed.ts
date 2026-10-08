import dbMigrationClient from "@/db/db-migration-client"

async function seed(): Promise<void> {
  try {
    await dbMigrationClient.seed.run()
  } catch (error) {
    console.error(`Seeding Failed: ${error}`, { error })
    throw error
  } finally {
    await dbMigrationClient.destroy()
  }
}

seed().catch(() => {
  process.exitCode = 1
})
