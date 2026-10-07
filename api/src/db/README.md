# Database & Migrations

Existing databases with a `SequelizeMeta` ledger use Umzug to complete any historical migrations.
New databases use the aggregated Knex production-schema migration. Sequelize remains the application
ORM. The migration pipeline detects the historical ledger before deciding which path to run.

## Migration Rules

- Keep files in `migrations/` unchanged; they are the historical `SequelizeMeta` upgrade path.
- Create new migrations with `dev migrate make <description>`.
- Run the complete pipeline with `dev migrate`.
- Inspect the Knex ledger with `dev migrate list`.
- The production-schema baseline fails before making changes if application tables exist without the
  historical ledger.
- Before Knex validates its ledger, `.ts` and `.js` entries for current migration files are normalized
  to extensionless names. A duplicate entry fails without changing schema or application data.
- Keep migrations clean — no extraneous comments.
- Find system user by email (`system.user@yukon.ca`), not `auth0Subject`.

**Historical Migration Patterns** → [`migrations/README.md`](migrations/README.md)
**New Knex Migration Patterns** → [`knex-migrations/README.md`](knex-migrations/README.md)
