import * as fileSystem from "fs/promises"
import path from "path"

import knex, { type Knex } from "knex"
import { isEmpty, isNil } from "lodash"

import { DB_HOST, DB_NAME, DB_PASS, DB_PORT, DB_TRUST_SERVER_CERTIFICATE, DB_USER } from "@/config"
export const KNEX_MIGRATION_DIRECTORY = path.resolve(__dirname, "knex-migrations")
export const KNEX_MIGRATION_EXTENSION = path.extname(__filename) === ".ts" ? "ts" : "js"
export const KNEX_MIGRATION_TEMPLATE = path.resolve(
  __dirname,
  `templates/sample-knex-migration.${KNEX_MIGRATION_EXTENSION}`
)


class MigrationFile {
  constructor(
    readonly name: string,
    readonly path: string
  ) {}
}

class MigrationFileSource implements Knex.MigrationSource<unknown> {
  constructor(private readonly directory: string) {}

  async getMigrations(loadExtensions: readonly string[]): Promise<MigrationFile[]> {
    const fileNames = await fileSystem.readdir(this.directory)
    const migrationFileNames = fileNames.filter((fileName) =>
      loadExtensions.includes(path.extname(fileName))
    )

    migrationFileNames.sort()

    return migrationFileNames.map(
      (fileName) =>
        new MigrationFile(
          path.basename(fileName, path.extname(fileName)),
          path.join(this.directory, fileName)
        )
    )
  }

  getMigrationName(migration: unknown): string {
    if (!(migration instanceof MigrationFile)) throw new Error("Expected a migration file.")

    return migration.name
  }

  async getMigration(migration: unknown): Promise<Knex.Migration> {
    if (!(migration instanceof MigrationFile)) throw new Error("Expected a migration file.")

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require(migration.path)
  }
}

function validateDatabaseConfiguration(): void {
  if (isEmpty(DB_NAME)) throw new Error("database name is unset.")
  if (isEmpty(DB_USER)) throw new Error("database username is unset.")
  if (isEmpty(DB_PASS)) throw new Error("database password is unset.")
  if (isEmpty(DB_HOST)) throw new Error("database host is unset.")
  if (isNil(DB_PORT) || Number.isNaN(DB_PORT)) throw new Error("database port is unset.")
}

export function buildKnexConfig(): Knex.Config {
  validateDatabaseConfiguration()

  return {
    client: "mssql",
    connection: {
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASS,
      database: DB_NAME,
      options: {
        encrypt: true,
        trustServerCertificate: DB_TRUST_SERVER_CERTIFICATE,
      },
    },
    migrations: {
      migrationSource: new MigrationFileSource(KNEX_MIGRATION_DIRECTORY),
    },
  }
}

const knexMigrationClient = knex(buildKnexConfig())

export default knexMigrationClient
