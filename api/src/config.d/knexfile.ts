import type { Knex } from "knex"

import { buildKnexConfig } from "@/db/db-migration-client"

const knexConfig = buildKnexConfig()

const config: Record<string, Knex.Config> = {
  development: knexConfig,
  test: knexConfig,
  production: knexConfig,
}

export default config
