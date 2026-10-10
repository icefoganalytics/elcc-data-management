# Database & Migrations

Knex runs migrations and environment-specific seeds. Sequelize remains the application ORM.
The Knex CLI hoists the migration client's configuration for each environment.

## Migration Rules

- Create migrations with `./bin/dev migrate make <description>` in `migrations/`.
- Run all pending migrations with `./bin/dev migrate latest`; inspect their state with `./bin/dev migrate list`.
  The helper forwards native Knex actions, as Wrap does: `up` runs one migration, not the full batch.
  Put Knex options after npm's `--` separator, for example `./bin/dev migrate list -- --env test`.
- The initial, model-sized table migrations create missing tables and never alter existing ones.
- Existing installations must have the current application schema before this cutover. Historical
  migrations are no longer executed; obsolete migration history is dropped after the table baseline succeeds.
- Knex owns the new `knex_migrations` and `knex_migrations_lock` tables. Do not rename their entries.
- Use compiled JavaScript for production and source TypeScript for development, on separate databases.
- Keep `extension: "ts"` and `.ts` stubs for generation. Use Knex's default loader extensions,
  as Wrap does, to run source TypeScript or compiled JavaScript from their respective directories.
- Initial table rollbacks drop their tables and data, including pre-existing tables. Use backups
  for production data recovery. Obsolete history cleanup is irreversible: rollback warns and
  continues without restoring it.
- The final payment fixup removes only the known redundant production foreign key, preserving its
  enabled, trusted counterpart and all payment data. Fresh databases skip it; rollback warns
  without recreating the duplicate.
- Separate schema changes from data backfills and keep backfills idempotent.
- Keep migrations clean — no extraneous comments.
- Find system users by email, not `auth0Subject`.

## Startup

- Database readiness and creation use Knex, with a server-level fallback when the target database is missing.
- Apply the startup grace period once. Bound readiness connection, query, and pool-acquisition timeouts,
  cancel completed health deadlines, and close initializer-owned clients.
- Run pending migrations in one atomic Knex batch so a failed baseline preserves application data
  and obsolete history.
- Keep initialization errors observable and return a failing status. The boot script intentionally
  starts the API afterward for Azure diagnostics; API availability does not prove migration success.

## Seeds

- Run seeds with `./bin/dev seed`; the package command delegates to native `knex seed:run`.
- Export `seed(knex)` and preserve idempotence; Knex has no seed-execution ledger.
- Use `seeds/development/` or `seeds/production/`. Tests use factories and skip startup seeds.
- The seed code may use existing Sequelize models and services.

**Migration Patterns** → [`migrations/README.md`](migrations/README.md)
