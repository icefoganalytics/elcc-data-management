# Database & Migrations

Knex runs migrations and environment-specific seeds. Sequelize remains the application ORM.

## Migration Rules

- Create migrations with `./bin/dev migrate make <description>` in `migrations/`.
- Run migrations with `./bin/dev migrate`; inspect their state with `./bin/dev migrate list`.
- The initial, model-sized table migrations create missing tables and never alter existing ones.
- Existing installations must have the current application schema before this cutover. Historical
  migrations are no longer executed; the existing `SequelizeMeta` table is left unused and unchanged.
- Knex owns the new `knex_migrations` and `knex_migrations_lock` tables. Do not rename their entries.
- Use compiled JavaScript for production and source TypeScript for development, on separate databases.
- Initial table migrations cannot be rolled back: a rollback must not drop pre-existing tables.
- Separate schema changes from data backfills and keep backfills idempotent.
- Keep migrations clean — no extraneous comments.
- Find system users by email, not `auth0Subject`.

## Seeds

- Export `seed(knex)` and preserve idempotence; Knex has no seed-execution ledger.
- Use `seeds/development/` or `seeds/production/`. Tests use factories and skip startup seeds.
- The seed code may use existing Sequelize models and services.

**Migration Patterns** → [`migrations/README.md`](migrations/README.md)
