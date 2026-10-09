import type { Knex } from "knex"

import dbMigrationClient from "@/db/db-migration-client"

const config: Record<string, Knex.Config> = {
  development: {
    ...dbMigrationClient.client.config,
  },
  test: {
    ...dbMigrationClient.client.config,
  },
  production: {
    ...dbMigrationClient.client.config,
  },
}

export default config
