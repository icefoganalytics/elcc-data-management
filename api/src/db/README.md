# Database & Migrations

Historical migrations use Umzug. New migrations use Knex. Sequelize remains the application ORM.
The migration pipeline runs the historical Umzug ledger before the Knex ledger. The Umzug storage
matches `.ts` and compiled `.js` migration filenames to the same historical ledger entry, so
production databases do not reapply existing schema changes.

## Migration Rules

- Keep files in `migrations/` unchanged; they are the historical `SequelizeMeta` upgrade path.
- Create new migrations with `dev migrate make <description>`.
- Run the complete pipeline with `dev api npm run migrate`.
- Use `migrate:legacy` only to inspect or maintain the historical Umzug migration ledger.
- Keep migrations clean — no extraneous comments.
- Find system user by email (`system.user@yukon.ca`), not `auth0Subject`.

**Historical Migration Patterns** → [`migrations/README.md`](migrations/README.md)
**New Knex Migration Patterns** → [`knex-migrations/README.md`](knex-migrations/README.md)
