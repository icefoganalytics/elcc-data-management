# Monthly Worksheet Persistence

A monthly worksheet combines records with different persistence owners. The shared presentation does not make worksheet JSON the owner of every displayed section.

## Persistence ownership

| Worksheet data                                                        | Authoritative store                                                       | Save boundary                                                                   |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Child Care Spaces                                                     | `child_care_spaces`, identified by centre, fiscal period, and category    | Only the two occupancy inputs are updated through the Child Care Spaces API.    |
| Administration (10% of Spaces)                                        | `administration_costs`, identified by centre, fiscal period, and category | Only the two occupancy inputs are updated through the Administration Costs API. |
| Remaining JSON-backed sections, including Quality Enhancement Program | `funding_submission_line_jsons.values`                                    | The worksheet JSON API receives only its own sections.                          |

The [JSON model](../../api/src/models/funding-submission-line-json.ts) attaches a [ledger-section exclusion validator](../../api/src/models/validators/does-not-contain-ledger-sections.ts) to `values`, covering both virtual `lines` and raw `values` writes. It checks each section through the same [section-name validator](../../api/src/models/validators/does-not-use-ledger-section.ts) used by shared configuration writes and bulk cloning. These prevent clients opened before a deployment from reintroducing Child Care Spaces or Administration and double-counting reconciliation. Both validators are pure and exported through the shared validator barrel: they recognize the retired shared-storage labels without importing ledger models, avoiding dependencies on model initialization order.

Both retired Administration labels, `Administration` and `Administration (10% of Spaces)`, are rejected by worksheet JSON and shared configuration writes. The worksheet displays the latter label for its ledger-backed section.

The [worksheet editor](../../web/src/components/funding-submission-line-jsons/FundingSubmissionLineJsonEditSheet.vue) composes the two ledgers and JSON for display, persists changed ledger rows before saving JSON-owned lines, and refreshes all three resources after success. **Replicate Estimates** first saves, then invokes each store's replication operation. Occupancy inputs remain read only until the entire save or replication workflow finishes, preventing edits between persistence requests.

The editor recalculates dependent totals from each section's own snapshotted rate when occupancy changes. If any source fails to load, it withholds editing and reloads all sources through **Reload Worksheet**.

The monthly page loads the worksheet and fiscal period together before mounting a centre/year/month-specific editor. It discards responses from superseded requests instead of pairing a newly selected worksheet with the previous month's fiscal period.

These are separate API requests, not one worksheet-wide transaction. A save or replication failure is surfaced, but completed requests are not rolled back across stores. All dispatched mutations settle before the editor unlocks, including after a sibling request fails. Categories replicate sequentially within each ledger to avoid overlapping SQL Server transactions; the independent persistence owners can still run concurrently. Each replication operation transacts its later-month updates; occupancy saves and replication reload persisted ledger inputs under repeatable-read isolation before calculating totals.

Occupancy edits and estimate replication use the standard `update()` authorization action on the ledger policies. Ordinary authenticated users retain these actions; only system administrators may create, edit, or retire annual category configuration.

## Category configuration ownership

`child_care_space_categories` owns category names, age ranges, and rates for each funding period. The category CRUD API and administration pages edit this configuration; monthly ledger rows retain their own historical name/rate snapshots. Both the API policy and edit form keep the category's funding period immutable after creation.

Explicit category forward application is a transactional exception to snapshot isolation: an inclusive starting fiscal month limits changes to the same funding period. It fills missing pairs without restoring retired rows; edits update only unchanged snapshots without actual occupancy. The [domain rules](../domain/child-care-spaces.md#forward-application) define preservation and recalculation.

Funding-period creation and development/production ensures provision categories separately from the remaining `funding_submission_lines`. The seven Administration defaults now belong to `administration_cost_categories`. Shared-line writes and bulk cloning reject both retired ledger sections at their configuration boundary. Centre initialization discovers categories by funding-period ID; later ensures preserve intentionally absent monthly rows and retired pairs. Worksheet JSON provisioning needs no ledger-section filter because its configuration source contains neither ledger section.

The centre's existing core setup determines worksheet access and first-time provisioning. Each ledger checks its own active and retired history independently: Spaces propagated before initial setup do not suppress Administration provisioning, while later ensures preserve intentionally absent months. Changes to the category catalogue do not make an already initialized year unavailable.

Ensures distinguish never-configured periods from deliberately emptied periods using category history; they do not restore retired categories. Legacy cleanup removes only rows still belonging to Child Care Spaces, retaining unrelated active and archived configuration referenced by historical ledger records.

The incremental migrations after the JSON cutover create categories, backfill category references, replace the ledger's `funding_submission_line_id` with required `category_id`, and remove migrated source configuration rows. The temporary source ID exists only during these migrations; it is not a runtime compatibility field. Active configuration is mapped to its fiscal year's funding periods. Historical ledger references also resolve changed, moved-year, and soft-deleted source configuration; a category outside its source's current year is retired without changing ledger snapshots.

Quality Enhancement Program configuration and JSON lines carry `childCareSpaceCategoryId` as linkage metadata, not a second Child Care Spaces value owner. Administration category configuration carries the same stable link, and each Administration monthly row preserves its own link snapshot. The editor propagates occupancy through these IDs even when category names and worksheet labels differ. Annual cloning remaps configuration links to the target funding period.

The linkage migration keeps its SQL Server operations directly in `up` and `down`, with comments explaining candidate matching, ambiguity rejection, and worksheet eligibility. `JSON_MODIFY` changes only category metadata, preserving array order, historical fields, unknown properties, and existing numeric tokens without JavaScript parsing. Reversal discovers the column's foreign-key name so both SQL-created and Knex-created constraints can be removed without changing worksheet or ledger facts.

Historical submission-line IDs are normalized directly from their JSON numeric tokens. Zero and integral decimal and exponent forms resolve the same non-negative 32-bit ID; strings, fractions, and out-of-range values do not match. Normalization avoids floating-point rounding, including for fractions smaller than JavaScript number precision.

Missing funding-period mappings or conflicting category references abort the backfill. Source removal checks that categories exist and active worksheet JSON no longer contains Child Care Spaces. The reference/configuration removal migrations reject automatic reversal because the original source data is required for restoration.

## Administration configuration and historical cutover

**Administration → Administration Cost Categories** manages names, age ranges, rates, and optional links to Child Care Space categories within the same funding period. Its funding period is immutable after creation. Normal edits and retirement affect future provisioning, not existing monthly name, rate, or linkage snapshots. Existing configured rates are preserved; the section title does not derive a live percentage from Child Care Spaces.

The [Administration cutover](../../api/src/db/migrations/20261020180002_migrate-administration-costs-from-worksheet-json.ts) preserves valid configuration, monthly values, exact totals, timestamps, and deletion state before retiring the old Administration stores. Malformed rows, invalid identifiers or decimals, inconsistent totals, unresolved fiscal context, and conflicts are skipped rather than blocking deployment. The first valid active snapshot in worksheet-ID and line order wins duplicate ledger keys; existing target records are not overwritten. Invalid optional Spaces links become null without losing valid financial values.

Cleanup discards unusable Administration entries along with migrated entries. Unrelated raw JSON, including references to retired Administration source IDs, remains unchanged; whole malformed or nonarray JSON documents are ignored unchanged. SQL, schema, and connection failures remain fatal and roll back the migration batch. Restoring discarded history requires the original backup; automatic reversal is intentionally rejected.

Historical Administration rows retain their explicit Spaces link or remain unlinked when the JSON has no link; current configuration never supplies a missing snapshot link. If a source configuration moves to another funding year, its reconstructed historical category is retired and does not inherit the new year's link. Current configuration still requires a link within its own funding period.

Administration saves and replication calculate four-decimal totals with decimal arithmetic using the persisted monthly rate. **Replicate Estimates** targets matching categories in later months of the same centre and funding period, clears actuals, and retains each target month's rate. Reconciliation adds its actual totals once alongside Spaces, remaining JSON, and Building Expenses.

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
- [Eligible-expense calculation](../../api/src/services/funding-reconciliations/calculate-eligible-expenses-period-amount-service.ts) combines the independent persistence owners; it must not reintroduce Child Care Spaces or Administration into the JSON sum.

## Regression evidence

These tests are executable evidence, not a claim that a particular release or authenticated browser scenario has passed:

Historical migration fixtures keep schema setup, data, migration calls, assertions, and cleanup on one fixture-owned Knex transaction. Nested savepoints exercise failed backfills without crossing ORM connections while schema locks are held.

- [Migration preservation, idempotency, and complete rollback](../../api/tests/db/migrations/migrate-child-care-spaces-from-worksheet-json.test.ts)
- [Category cutover preservation, moved-year configuration, and rollback](../../api/tests/db/migrations/backfill-child-care-space-categories.test.ts)
- [Exact historical numeric-ID linkage and metadata preservation](../../api/tests/db/migrations/link-funding-submission-lines-to-child-care-space-categories.test.ts)
- [Administration migration preservation and best-effort legacy-data cleanup](../../api/tests/db/migrations/migrate-administration-costs-from-worksheet-json.test.ts)
- [Financial persistence and precision](../../api/tests/models/child-care-space.test.ts)
- [Stale-client JSON rejection and accepted JSON-owned writes](../../api/tests/controllers/funding-submission-line-jsons-controller.test.ts)
- [Historical initialization](../../api/tests/services/centres/funding-periods/is-initialized-service.test.ts)
- [Estimate replication isolation](../../api/tests/services/child-care-spaces/replicate-estimates-service.test.ts)
- [Funding-period deletion isolation](../../api/tests/services/funding-periods/destroy-service.test.ts)
- [Eligible-expense composition](../../api/tests/services/funding-reconciliations/calculate-eligible-expenses-period-amount-service.test.ts)
- [Worksheet propagation, split saves, and replication](../../web/tests/components/funding-submission-line-jsons/FundingSubmissionLineJsonEditSheet.test.ts)
- [Coherent worksheet identity during asynchronous month navigation](../../web/tests/pages/child-care-centres/worksheets/MonthlyWorksheetPage.test.ts)
- [Latest enrollment with empty future months](../../web/tests/components/funding-line-values/FundingLineValuesEnrollmentChart.test.ts)
