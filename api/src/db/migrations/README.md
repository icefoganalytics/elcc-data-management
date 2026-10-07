# Historical Umzug Migration Archive

Do not add or edit files in this directory. They remain the upgrade path only for existing databases
with a `SequelizeMeta` ledger that has not completed the historical migration sequence.

New databases use the aggregated production schema in
[`../knex-migrations/`](../knex-migrations/). Create every subsequent migration with
`dev migrate make <description>`.
