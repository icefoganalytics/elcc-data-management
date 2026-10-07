import { Umzug, SequelizeStorage, MigrationParams } from "umzug"
import { DataTypes, Model } from "@sequelize/core"
import { Attribute, NotNull, PrimaryKey, Table } from "@sequelize/core/decorators-legacy"
import { MsSqlQueryInterface } from "@sequelize/mssql"

import fs from "fs"
import path from "path"

import logger from "@/utils/logger"
import sequelize from "@/db/db-client"

import { UmzugNullStorage } from "@/db/umzug-null-storage"
import { sequelizeAutoTransactionResolver } from "@/db/utils/sequelize-auto-transaction-resolver"

// Create a custom SequelizeMeta model to avoid charset/collate options that are incompatible with MSSQL
@Table({
  tableName: "SequelizeMeta",
  timestamps: false,
  charset: undefined,
  collate: undefined,
})
class SequelizeMeta extends Model {
  @Attribute(DataTypes.STRING(255))
  @PrimaryKey
  @NotNull
  declare name: string
}

sequelize.addModels([SequelizeMeta])

export class RuntimeAwareSequelizeStorage extends SequelizeStorage {
  async executed(): Promise<string[]> {
    const migrationNames = await super.executed()
    const runtimeExtension = path.extname(__filename)

    return migrationNames.map((migrationName) =>
      migrationName.replace(/\.(?:ts|js)$/, runtimeExtension),
    )
  }

  async unlogMigration({ name: migrationName }: { name: string }): Promise<void> {
    const runtimeExtension = path.extname(__filename)
    const alternateExtension = runtimeExtension === ".ts" ? ".js" : ".ts"
    const alternateMigrationName = migrationName.replace(/\.(?:ts|js)$/, alternateExtension)

    await super.unlogMigration({ name: alternateMigrationName })
    await super.unlogMigration({ name: migrationName })
  }
}

export const migrator = new Umzug({
  migrations: {
    glob: ["migrations/*.{ts,js}", { cwd: __dirname }],
    resolve: sequelizeAutoTransactionResolver,
  },
  context: sequelize.queryInterface,
  storage: new RuntimeAwareSequelizeStorage({
    sequelize,
    model: SequelizeMeta,
    // has run in all environments.
    // timestamps: true,
  }),
  logger,
  create: {
    folder: path.join(__dirname, "migrations"),
    template: (filepath) => {
      const templatePath = path.join(__dirname, "templates/sample-migration.ts")
      const template = fs.readFileSync(templatePath).toString()
      return [[filepath, template]]
    },
  },
})

const environment = process.env.NODE_ENV || "development"
export const seeder = new Umzug({
  migrations: {
    glob: [`seeds/${environment}/*.{ts,js}`, { cwd: __dirname }],
  },
  storage: new UmzugNullStorage(),
  logger,
  create: {
    folder: path.join(__dirname, "seeds", environment),
    template: (filepath) => {
      const templatePath = path.join(__dirname, "templates/sample-seed.ts")
      const template = fs.readFileSync(templatePath).toString()
      return [[filepath, template]]
    },
  },
})

export type Migration = MigrationParams<MsSqlQueryInterface>
export type SeedMigration = MigrationParams<never>
