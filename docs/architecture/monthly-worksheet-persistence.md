# Monthly Worksheet Persistence

A monthly worksheet combines records with different persistence owners. The shared presentation does not make worksheet JSON the owner of every displayed section.

## Persistence ownership

| Worksheet data                                           | Authoritative store                                                       | Save boundary                                                                   |
| -------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Child Care Spaces                                        | `child_care_spaces`, identified by centre, fiscal period, and category    | Only the two occupancy inputs are updated through the Child Care Spaces API.    |
| Quality Enhancement Program                              | `quality_enhancements`, identified by centre, fiscal period, and category | Only the two occupancy inputs are updated through the Quality Enhancements API. |
| Remaining JSON-backed sections, including Administration | `funding_submission_line_jsons.values`                                    | The worksheet JSON API receives only its own sections.                          |

The [JSON model](../../api/src/models/funding-submission-line-json.ts) attaches named exclusion validators for Child Care Spaces and Quality Enhancement Program to `values`, covering both virtual `lines` and raw `values` writes. This prevents clients opened before a deployment from reintroducing competing copies and double-counting reconciliation. Model-dependent validators are imported directly; the shared validator barrel remains independent of model initialization.

The [worksheet editor](../../web/src/components/funding-submission-line-jsons/FundingSubmissionLineJsonEditSheet.vue) composes all three stores for display, persists changed ledger rows before saving JSON-owned lines, and refreshes every resource after success. **Replicate Estimates** first saves, then invokes each store's replication operation. Occupancy inputs remain read only until the entire save or replication workflow finishes, preventing edits between persistence requests.

The editor recalculates dependent totals from each section's own snapshotted rate when occupancy changes. If any source fails to load, it withholds editing and reloads all sources through **Reload Worksheet**.

The monthly page loads the worksheet and fiscal period together before mounting a centre/year/month-specific editor. It discards responses from superseded requests instead of pairing a newly selected worksheet with the previous month's fiscal period.

These are separate API requests, not one worksheet-wide transaction. A save or replication failure is surfaced, but completed requests are not rolled back across stores. All dispatched mutations settle before the editor unlocks, including after a sibling request fails. Each [Child Care Spaces replication operation](../../api/src/services/child-care-spaces/replicate-estimates-service.ts) transacts its later-month updates; occupancy saves and replication reload persisted ledger inputs under repeatable-read isolation before calculating totals.

Occupancy edits and estimate replication use the standard `update()` authorization action on the [Child Care Spaces policy](../../api/src/policies/child-care-space-policy.ts).

## Category configuration ownership

`child_care_space_categories` owns category names, age ranges, and rates for each funding period. The category CRUD API and administration pages edit this configuration; monthly ledger rows retain their own historical name/rate snapshots. Both the API policy and edit form keep the category's funding period immutable after creation.

Explicit category forward application is a transactional exception to snapshot isolation: an inclusive starting fiscal month limits changes to the same funding period. It fills missing pairs without restoring retired rows; edits update only unchanged snapshots without actual occupancy. The [domain rules](../domain/child-care-spaces.md#forward-application) define preservation and recalculation.

Funding-period creation and development/production ensures provision categories separately from the remaining `funding_submission_lines`. Fresh shared-line defaults retain the seven Administration rows. Shared-line writes reject the retired Child Care Spaces and Quality Enhancement Program sections at their configuration boundary. Centre initialization discovers categories by funding-period ID; worksheet JSON provisioning does not generate either ledger-owned section.

The centre's existing core setup determines worksheet access. Changes to the category catalogue do not make an already initialized year unavailable or require retroactive provisioning of intentionally absent earlier-month rows.

Ensures distinguish never-configured periods from deliberately emptied periods using category history; they do not restore retired categories. Legacy cleanup removes only rows still belonging to Child Care Spaces, retaining unrelated active and archived configuration referenced by historical ledger records.

The incremental migrations after the JSON cutover create categories, backfill category references, replace the ledger's `funding_submission_line_id` with required `category_id`, and remove migrated source configuration rows. The temporary source ID exists only during these migrations; it is not a runtime compatibility field. Active configuration is mapped to its fiscal year's funding periods. Historical ledger references also resolve changed, moved-year, and soft-deleted source configuration; a category outside its source's current year is retired without changing ledger snapshots.

Administration configuration/JSON and Quality Enhancement category/ledger snapshots carry `childCareSpaceCategoryId` as linkage metadata, not a second Child Care Spaces value owner. Links stay within the same funding period. Existing linkage migrations preserve historical labels, rates, occupancy, totals, and numeric tokens while rejecting conflicting or ambiguous category IDs. Annual cloning remaps links to the target period's category, and the editor propagates occupancy by stable ID even when names differ.

The linkage migration keeps its SQL Server operations directly in `up` and `down`, with comments explaining candidate matching, ambiguity rejection, and worksheet eligibility. `JSON_MODIFY` changes only category metadata, preserving array order, historical fields, unknown properties, and existing numeric tokens without JavaScript parsing. Reversal discovers the column's foreign-key name so both SQL-created and Knex-created constraints can be removed without changing worksheet or ledger facts.

Historical submission-line IDs are normalized directly from their JSON numeric tokens. Zero and integral decimal and exponent forms resolve the same non-negative 32-bit ID; strings, fractions, and out-of-range values do not match. Normalization avoids floating-point rounding, including for fractions smaller than JavaScript number precision.

Missing funding-period mappings or conflicting category references abort the backfill. Source removal checks that categories exist and active worksheet JSON no longer contains Child Care Spaces. The reference/configuration removal migrations reject automatic reversal because the original source data is required for restoration.

## Quality Enhancement ownership

`quality_enhancement_categories` owns annual names, age ranges, base amounts, and optional Child Care Space category links. **Administration → Quality Enhancement Categories** provides dedicated create, read, edit, and retire pages. Only system administrators can mutate configuration; its funding period is immutable after creation. Editing or retiring a category does not rewrite existing monthly snapshots.

New annual configuration copies the latest configured earlier fiscal year, never a future year. Source-period selection includes retired category history so an intentionally emptied year stays empty instead of reviving older categories or defaults.

Each monthly `quality_enhancements` record preserves its category name/link, base amount, hot-meal increment/date, occupancy, and computed totals. Decimal arithmetic calculates its effective amount as base plus increment and rejects inputs beyond four decimal places. Initial centre/year provisioning snapshots active categories and the centre's regional hot-meal amount. Later ensures preserve deliberately absent or retired records.

Hot-meal toggles affect current and future fiscal periods only, preserve occupancy, and recalculate totals from the stored base. Historical months remain unchanged. Editing a regional hot-meal amount does not propagate into existing worksheets. Estimate replication copies occupancy into later months of the same centre, category, and funding period, clears actuals, and preserves each target's rates and links.

Worksheet and category lookups abort superseded reads and release them when their view closes. Canceled reads do not become load errors; failed active reads retain their reload controls. Category saves are committed mutations and are not canceled by navigation.

The [Quality Enhancement cutover](../../api/src/db/migrations/20261020220002_migrate-quality-enhancements-from-worksheet-json.ts) moves active and archived configuration and worksheet values into the two new stores, preserving supplied historical totals rather than recalculating them. Hot-meal metadata separates base from increment. Conflicting mappings, unknown enhancement metadata, or lossy decimal conversion abort the migration. Only successfully migrated source sections are removed; unrelated JSON numeric tokens remain intact. Reversal requires original source data and a backup.

## Historical JSON cutover

The [native Knex data migration](../../api/src/db/migrations/20261007174315_migrate-child-care-spaces-from-worksheet-json.ts) processes active worksheets in batches. It resolves their fiscal month and preserves each source line's name, monthly amount, occupancy inputs, and matching supplied totals; absent totals are calculated. Source configuration is resolved by persisted ID, including changed or soft-deleted configuration. SQL Server reconstructs the retained JSON array from raw elements in their original order, preserving high-precision numeric tokens and unknown properties without JavaScript reserialization.

All source values must be represented before their JSON section is removed. Submission-line IDs must be non-negative safe integers; numeric strings, fractions, negative values, and unsafe integers abort the cutover without deleting source values. Matching existing ledger rows make success idempotent. Conflicts, duplicate or malformed lines, unresolved references or periods, inconsistent totals, and lossy decimal conversion abort the migration.

This fail-closed cutover is essential: retaining a writable JSON copy while reporting from the ledger creates competing owners. A successful migration has no automatic data rollback; its `down` operation only warns. Restoring pre-cutover JSON requires the original data and manual restoration.

## Knex execution and recovery

All cutover files export native `up(knex)` and `down(knex)` functions and use timestamped Knex filenames. The [migration client](../../api/src/db/db-migration-client.ts) discovers the same sequence from TypeScript in development and compiled JavaScript in production, using Knex's migration history and lock.

`./bin/dev migrate latest` applies the pending batch in one transaction. A failure rolls back earlier schema changes, ledger inserts, JSON removal, and obsolete-history cleanup in that batch. `./bin/dev migrate up` applies only the next migration, so separately invoked commands are not one transaction.

Knex rollback commits successful reversals individually. A later irreversible-data guard can stop rollback after the reversible category-link migration has already removed its column. Reapplying `./bin/dev migrate latest` restores that linkage; restoring pre-cutover configuration or worksheet JSON still requires the original data and a backup. Do not treat rollback as a production data-recovery strategy.

Linkage reapplication can recover preserved worksheet category IDs after a category rename has propagated to ledger snapshots. The category must still belong to the worksheet's funding period and have a ledger row for its centre and month; name-based inference and conflicting-match rejection remain in place.

Development and production seeds export `seed(knex)`. They continue to use the application ensures for category provisioning and remain idempotent; no Umzug resolver or compatibility history is retained.

## Maintenance boundaries

- [Child Care Spaces domain rules](../domain/child-care-spaces.md) define historical identity, financial consistency, propagation, and reporting behavior.
- [Ledger/template and scope patterns](../../api/src/models/README.md) describe snapshot ownership and safe bulk-mutation predicates.
- [The enrollment chart](../../web/src/components/funding-line-values/FundingLineValuesEnrollmentChart.vue) reads the ledger by centre and fiscal year, ordered by fiscal-period start date.
- [Eligible-expense calculation](../../api/src/services/funding-reconciliations/calculate-eligible-expenses-period-amount-service.ts) combines the independent persistence owners; it must not reintroduce Child Care Spaces into the JSON sum.

## Regression evidence

These tests are executable evidence, not a claim that a particular release or authenticated browser scenario has passed:

Historical migration fixtures keep schema setup, data, migration calls, assertions, and cleanup on one fixture-owned Knex transaction. Nested savepoints exercise failed backfills without crossing ORM connections while schema locks are held.

- [Migration preservation, idempotency, and complete rollback](../../api/tests/db/migrations/migrate-child-care-spaces-from-worksheet-json.test.ts)
- [Quality Enhancement snapshots, raw JSON preservation, idempotency, and rejected lossy cutovers](../../api/tests/db/migrations/migrate-quality-enhancements-from-worksheet-json.test.ts)
- [Category cutover preservation, moved-year configuration, and rollback](../../api/tests/db/migrations/backfill-child-care-space-categories.test.ts)
- [Exact historical numeric-ID linkage and metadata preservation](../../api/tests/db/migrations/link-funding-submission-lines-to-child-care-space-categories.test.ts)
- [Financial persistence and precision](../../api/tests/models/child-care-space.test.ts)
- [Stale-client JSON rejection and accepted JSON-owned writes](../../api/tests/controllers/funding-submission-line-jsons-controller.test.ts)
- [Historical initialization](../../api/tests/services/centres/funding-periods/is-initialized-service.test.ts)
- [Estimate replication isolation](../../api/tests/services/child-care-spaces/replicate-estimates-service.test.ts)
- [Funding-period deletion isolation](../../api/tests/services/funding-periods/destroy-service.test.ts)
- [Eligible-expense composition](../../api/tests/services/funding-reconciliations/calculate-eligible-expenses-period-amount-service.test.ts)
- [Worksheet propagation, split saves, and replication](../../web/tests/components/funding-submission-line-jsons/FundingSubmissionLineJsonEditSheet.test.ts)
- [Coherent worksheet identity during asynchronous month navigation](../../web/tests/pages/child-care-centres/worksheets/MonthlyWorksheetPage.test.ts)
- [Latest enrollment with empty future months](../../web/tests/components/funding-line-values/FundingLineValuesEnrollmentChart.test.ts)
