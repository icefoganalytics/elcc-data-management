import { NODE_ENV } from "@/config"
import dbMigrationClient from "@/db/db-migration-client"
import { Centre } from "@/models"

export async function runSeeds(): Promise<void> {
  if (NODE_ENV === "test") return

  if (process.env.SKIP_SEEDING_UNLESS_EMPTY === "true") {
    const count = await Centre.count({ logging: false })

    if (count > 0) {
      console.warn("Skipping seeding as SKIP_SEEDING_UNLESS_EMPTY set, and data already seeded.")
      return
    }
  }

  try {
    await dbMigrationClient.seed.run()
  } catch (error) {
    console.error(`Error running seeds: ${error}`, { error })
    throw error
  }

  return
}

export default runSeeds
