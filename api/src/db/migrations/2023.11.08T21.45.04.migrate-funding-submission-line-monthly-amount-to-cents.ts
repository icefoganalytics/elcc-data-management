import { DataTypes } from "sequelize"

import type { Migration } from "@/db/umzug"
import { MssqlSimpleTypes } from "@/db/utils/mssql-simple-types"

export const up: Migration = async ({ context: queryInterface }) => {
  throw new Error("Not implemented")
  // TODO:
}

export const down: Migration = async ({ context: queryInterface }) => {
  throw new Error("Not implemented")
  await queryInterface.dropTable("users")
}
