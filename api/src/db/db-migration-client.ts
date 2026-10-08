import path from "path"

import knex, { type Knex } from "knex"
import { isEmpty, isNil, merge } from "lodash"

import {
  DB_HOST,
  DB_NAME,
  DB_PASS,
  DB_PORT,
  DB_TRUST_SERVER_CERTIFICATE,
  DB_USER,
  NODE_ENV,
} from "@/config"

if (isEmpty(DB_NAME)) throw new Error("database name is unset.")
if (isEmpty(DB_USER)) throw new Error("database username is unset.")
if (isEmpty(DB_PASS)) throw new Error("database password is unset.")
if (isEmpty(DB_HOST)) throw new Error("database host is unset.")
if (isNil(DB_PORT) || Number.isNaN(DB_PORT)) throw new Error("database port is unset.")

const runtimeExtension = path.extname(__filename)

export function buildKnexConfig(options?: Knex.Config): Knex.Config {
  return merge(
    {
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
        directory: path.resolve(__dirname, "migrations"),
        extension: "ts",
        loadExtensions: [runtimeExtension],
        stub: path.resolve(__dirname, `templates/sample-migration${runtimeExtension}`),
      },
      seeds: {
        directory: path.resolve(__dirname, `seeds/${NODE_ENV}`),
        extension: "ts",
        loadExtensions: [runtimeExtension],
        stub: path.resolve(__dirname, `templates/sample-seed${runtimeExtension}`),
      },
    },
    options
  )
}

const dbMigrationClient = knex(buildKnexConfig())

export default dbMigrationClient
