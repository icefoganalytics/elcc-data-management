# Monthly Worksheet Persistence

A monthly worksheet combines records with different persistence owners. The shared presentation does not make worksheet JSON the owner of every displayed section.

## Persistence ownership

| Worksheet data                 | Authoritative store                                                                              | Save boundary                                                                   |
| ------------------------------ | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Child Care Spaces              | `child_care_spaces`, identified by centre, fiscal period, and category                           | Only the two occupancy inputs are updated through the Child Care Spaces API.    |
| Children with Diverse Needs    | `children_with_diverse_needs_funding_records`, identified by centre, fiscal period, and category | Only the two occupancy inputs are updated through the Diverse Needs API.        |
| Administration (10% of Spaces) | `administration_costs`, identified by centre, fiscal period, and category                        | Only the two occupancy inputs are updated through the Administration Costs API. |
| Quality Enhancement Program    | `quality_enhancements`, identified by centre, fiscal period, and category                        | Only the two occupancy inputs are updated through the Quality Enhancements API. |
| Remaining JSON-backed sections | `funding_submission_line_jsons.values`                                                           | The worksheet JSON API receives only its own sections.                          |

The [JSON model](../../api/src/models/funding-submission-line-json.ts) rejects ledger-owned sections through validation of `values`, covering both virtual `lines` and raw `values` writes. Shared configuration writes and bulk cloning reject the same retired sections. This prevents clients opened before a deployment from reintroducing competing copies and double-counting reconciliation.

Both retired Administration labels, `Administration` and `Administration (10% of Spaces)`, are rejected by worksheet JSON and shared configuration writes. The worksheet displays the latter label for its ledger-backed section.

The [monthly worksheet page](../../web/src/pages/child-care-centres/worksheets/MonthlyWorksheetPage.vue) retains the original section order: Child Care Spaces, Administration (10% of Spaces), Quality Enhancement Program, Children with Diverse Needs, and Building Expenses. The first three start with the original seven matching categories; Diverse Needs retains its four-category catalogue. Committing Spaces input previews counts and recalculated totals in existing linked Administration and Quality Enhancement rows; **Save** persists that propagation. Each dependent row uses its own historical rate, and stable category IDs keep the mapping correct after renaming. Diverse Needs remains independent. Diverse Needs, Administration, and Quality Enhancement use independent editable tables like Building Expenses: committing an occupancy field saves immediately, **Escape** cancels an uncommitted edit, and each section offers category-based creation and policy-gated deletion. Optional forward creation fills missing rows in later fiscal months of the same funding period without changing existing rows.

Building Expenses passes its loading, save, and deletion state to the shared editable table's `busy` prop. While a row-switch save is pending, the table is inert so a server response cannot discard a newly entered edit in the destination row. The shared table restores keyboard focus to that row after the save settles.

**Enter** advances down the current column and continues into the next worksheet section; **Shift+Enter** reverses that path. Empty or unavailable sections are skipped. Navigation awaits the source row's save before opening the destination, and a failed save stops the transition. Within a table, pending row and column focus resumes once saving settles and inputs render enabled. Cancelling or clearing the active row discards pending focus. Amounts and occupancy omit unused decimal zeros while retaining meaningful digits up to their supported financial precision; display formatting does not change stored precision.

**Save** appears below Child Care Spaces and any remaining JSON-backed sections; immediate-save tables have no Save buttons. The month heading retains **Replicate Estimates**. Saving commits active Diverse Needs, Administration, and Quality Enhancement edits before persisting Child Care Spaces and JSON-owned lines through the [JSON worksheet editor](../../web/src/components/funding-submission-line-jsons/FundingSubmissionLineJsonEditSheet.vue). A Spaces occupancy update copies occupancy to linked Administration and Quality Enhancement rows in the same database transaction, recalculating each dependent total from its own snapshotted rate. Links use stable category IDs, not names; Diverse Needs remains independent of Spaces occupancy. The page refreshes both dependent tables after the worksheet save attempt, including partial failure, before restoring editing.

Each table owns its load, save, and recovery errors. A failed save remains visible while the table reloads persisted values; a failed reload keeps stale rows non-editable until a successful **Retry**. Failure of the JSON or Spaces source blocks the JSON editor until **Reload Worksheet** succeeds. Independent table load failures also disable cross-section estimate replication.

The monthly page loads the worksheet and fiscal period together before mounting a centre/year/month-specific editor. It discards responses from superseded requests instead of pairing a newly selected worksheet with the previous month's fiscal period. Changing context releases the unmounted creation form's busy state without canceling its committed request or unlocking a newer creation.

**Replicate Estimates** commits active table edits, saves Child Care Spaces and JSON-owned lines, refreshes linked tables, then invokes each store's replication operation. These are separate API requests, not one worksheet-wide transaction: failures are surfaced, but completed requests are not rolled back across stores. All dispatched mutations settle before editing unlocks, including after a sibling request fails. Categories replicate sequentially within each ledger to avoid overlapping SQL Server transactions; the independent persistence owners can run concurrently. Each replication operation transacts its later-month updates. Administration uses controller-loaded records for ordinary occupancy updates and estimate replication, with default database isolation for multi-row replication. Child Care Spaces retains its repeatable-read refreshes.

Ordinary authenticated users can create monthly Diverse Needs, Administration, and Quality Enhancement rows, edit occupancy, and replicate estimates. Only system administrators can delete monthly rows or create, edit, and retire annual category configuration.

Estimate replication updates only matching active later-month rows. It skips absent or retired monthly rows without recreating them, so current-month-only creation and later-month deletion remain intentional.

Deleting a monthly row first commits and awaits any active occupancy edit. If that save fails, deletion stops instead of discarding another row's uncommitted values.

## Category configuration ownership

`child_care_space_categories` owns category names, age ranges, and rates for each funding period. The category CRUD API and administration pages edit this configuration; monthly ledger rows retain their own historical name/rate snapshots. Both the API policy and edit form keep the category's funding period immutable after creation.

Individual category retirement is blocked while active dependents reference the category. This applies to Child Care Spaces, Administration Costs, Quality Enhancement, and Children with Diverse Needs, matching Building Expenses. Spaces also checks linked Administration and Quality Enhancement categories, their monthly records, and remaining shared funding lines. Dependent records must first be explicitly deleted, or optional category links removed; already soft-deleted dependents do not block retirement. Retiring a category never cascades deletion to its dependents.

Explicit category forward application is a transactional exception to snapshot isolation: an inclusive starting fiscal month limits changes to the same funding period. It fills missing pairs without restoring retired rows; edits update only unchanged snapshots without actual occupancy. The [domain rules](../domain/child-care-spaces.md#forward-application) define preservation and recalculation.

Funding-period creation and development/production ensures provision categories separately from the remaining `funding_submission_lines`. The seven Administration defaults belong to `administration_cost_categories`; the four Diverse Needs defaults belong to `children_with_diverse_needs_funding_categories`. Shared-line writes and bulk cloning reject all ledger-owned sections at their configuration boundary. Centre initialization discovers categories by funding-period ID; later ensures preserve intentionally absent monthly rows and retired pairs. Worksheet JSON provisioning does not generate ledger-owned sections and creates empty worksheets when no JSON-owned configuration remains.

The centre's existing core setup determines worksheet access and first-time provisioning. Each ledger checks its own active and retired history independently: Spaces propagated before initial setup do not suppress Administration provisioning, while later ensures preserve intentionally absent months. Changes to the category catalogue do not make an already initialized year unavailable.

Ensures distinguish never-configured periods from deliberately emptied periods using category history; they do not restore retired categories. Legacy cleanup removes only rows still belonging to Child Care Spaces, retaining unrelated active and archived configuration referenced by historical ledger records.

The incremental migrations after the JSON cutover create categories, backfill category references, replace the ledger's `funding_submission_line_id` with required `category_id`, and remove migrated source configuration rows. The temporary source ID exists only during these migrations; it is not a runtime compatibility field. Active configuration is mapped to its fiscal year's funding periods. Historical ledger references also resolve changed, moved-year, and soft-deleted source configuration; a category outside its source's current year is retired without changing ledger snapshots.

Administration and Quality Enhancement categories and monthly snapshots carry `childCareSpaceCategoryId` as linkage metadata, not a second Child Care Spaces value owner. Configuration links stay within the same funding period; monthly rows retain historical links independently. Annual cloning remaps configuration links to the target period's category. Spaces occupancy saves update only existing linked rows for the same centre and month; they do not create missing dependent rows or change historical rates.

The linkage migration keeps its SQL Server operations directly in `up` and `down`, with comments explaining candidate matching, ambiguity rejection, and worksheet eligibility. `JSON_MODIFY` changes only category metadata, preserving array order, historical fields, unknown properties, and existing numeric tokens without JavaScript parsing. Reversal discovers the column's foreign-key name so both SQL-created and Knex-created constraints can be removed without changing worksheet or ledger facts.

Historical submission-line IDs are normalized directly from their JSON numeric tokens. Zero and integral decimal and exponent forms resolve the same non-negative 32-bit ID; strings, fractions, and out-of-range values do not match. Normalization avoids floating-point rounding, including for fractions smaller than JavaScript number precision.

Missing funding-period mappings or conflicting category references abort the backfill. Source removal checks that categories exist and active worksheet JSON no longer contains Child Care Spaces. The reference/configuration removal migrations reject automatic reversal because the original source data is required for restoration.

## Diverse Needs ownership

`children_with_diverse_needs_funding_categories` owns annual names, optional age ranges, and monthly amounts. Its API permits only system administrators to create, edit, and retire configuration, and keeps the funding period immutable after creation. Editing annual configuration leaves existing monthly snapshots unchanged. Retirement requires the category to have no active funding records.

`ChildrenWithDiverseNeedsFundingCategory.DEFAULTS` owns the initial Diverse Needs catalog. `FundingSubmissionLine` still owns sections not yet individualized; its now-empty defaults catalog, model property, and provisioning fallback remain wired until the remaining shared model and its consumers are retired together.

Each `children_with_diverse_needs_funding_records` row snapshots its category name and rate for one centre and fiscal month. Decimal arithmetic computes totals from the two occupancy inputs. Annual provisioning copies the latest configured earlier period, including retired history so intentionally emptied years stay empty. Monthly ensures provision active categories only when the centre and funding period have no record history, including retired rows; callers do not supply an initialization flag. Existing history preserves intentionally absent months and retired rows on repeated ensures. Centre and funding-period deletion retire their monthly rows, and funding-period deletion also retires its annual categories.

Monthly provisioning iterates fiscal periods and active categories in bounded batches and returns only completion, not a collection of created records. Its transaction rolls back newly created snapshots if provisioning fails; existing active and retired snapshots remain untouched.

Estimate replication updates existing active later-month rows for the same centre, category, and funding period, resets actual occupancy, and preserves each target's rate and name. Diverse Needs has no hot-meal increment or Child Care Spaces occupancy link. Reconciliation adds its actual totals once, separately from worksheet JSON.

The [Diverse Needs backfill](/api/src/db/migrations/20261020230002_migrate-diverse-needs-from-shared-lines-and-worksheet-json-to-categories-and-records.ts) preserves active and archived configuration, monthly snapshots, supplied totals, timestamps, and retirement state. Historical identifiers accept exact integral JSON numeric tokens, including zero and exponent forms. Moved-year configuration reconstructs retired historical categories without repricing snapshots. Conflicting mappings, duplicate properties, unknown fields, malformed values, and lossy decimal conversions abort the backfill without removing source data.

The following [legacy-source cleanup](/api/src/db/migrations/20261020230003_remove-diverse-needs-from-shared-lines-and-worksheet-json.ts) removes the migrated section and shared configuration while preserving unrelated raw JSON. Apply both pending migrations together with `./bin/dev migrate latest` before running the cutover application; Knex rolls back both phases if either fails in that batch. Applying the backfill alone leaves the legacy sources intact, not a completed ownership cutover. Restoring the original stores after cleanup requires the pre-cutover backup.

## Quality Enhancement ownership

`quality_enhancement_categories` owns annual names, age ranges, base amounts, and optional Child Care Space category links through its dedicated category API. **Administration → Quality Enhancement Categories** provides annual browsing and dedicated create, read, edit, and retire pages. Only system administrators can mutate configuration; its funding period is immutable after creation. Editing a category does not rewrite existing monthly snapshots. Retirement requires the category to have no active Quality Enhancement records.

New annual configuration copies the latest configured earlier fiscal year, never a future year. Source-period selection includes retired category history so an intentionally emptied year stays empty instead of reviving older categories or defaults.

Each monthly `quality_enhancements` record preserves its category name/link, base amount, hot-meal increment/date, occupancy, and computed totals. Decimal arithmetic calculates its effective amount as base plus increment and rejects inputs beyond four decimal places. Initial centre/year provisioning snapshots active categories and the centre's regional hot-meal amount. Later ensures preserve deliberately absent or retired records.

Hot-meal toggles affect current and future fiscal periods only, preserve occupancy, and recalculate totals from the stored base. Applying or removing hot meals selects and updates all affected rows within one transaction, so any failed row update rolls back the whole operation, including when called inside the centre-update transaction. Historical months remain unchanged. Editing a regional hot-meal amount does not propagate into existing worksheets. Estimate replication copies occupancy into later months of the same centre, category, and funding period, clears actuals, and preserves each target's rates and links.

Worksheet and category lookups abort superseded reads and release them when their view closes. Canceled reads do not become load errors; failed active reads retain their reload controls. Category saves are committed mutations and are not canceled by navigation.

The [Quality Enhancement cutover](../../api/src/db/migrations/20261020220002_migrate-quality-enhancements-from-worksheet-json.ts) moves active and archived configuration and worksheet values into the two new stores, preserving supplied historical totals rather than recalculating them. Hot-meal metadata separates base from increment. Conflicting mappings, unknown enhancement metadata, or lossy decimal conversion abort the migration. Only successfully migrated source sections are removed; unrelated JSON numeric tokens remain intact. Reversal requires original source data and a backup.

Historical submission-line and Spaces category identifiers are normalized exactly from integral JSON decimal or exponent tokens before checking the non-negative SQL `INT` range. Fractional identifiers are rejected rather than rounded, including fractions beyond JavaScript number precision.

Historical worksheet rows retain only their explicit Spaces category link. An absent or null historical link stays null even when the current annual configuration or category name matches a Spaces category; the cutover must not introduce occupancy coupling into an independent snapshot.

## Administration configuration and historical cutover

**Administration → Administration Cost Categories** manages names, age ranges, rates, and optional links to Child Care Space categories within the same funding period. Its funding period is immutable after creation. Normal edits affect future provisioning, not existing monthly name, rate, or linkage snapshots. Retirement requires the category to have no active Administration Cost records. Existing configured rates are preserved; the section title does not derive a live percentage from Child Care Spaces.

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
- [Eligible-expense calculation](../../api/src/services/funding-reconciliations/calculate-eligible-expenses-period-amount-service.ts) combines the independent persistence owners; ledger-owned sections must not also enter the JSON sum.

## Regression evidence

These tests are executable evidence, not a claim that a particular release or authenticated browser scenario has passed:

Historical migration fixtures keep schema setup, data, migration calls, assertions, and cleanup on one fixture-owned Knex transaction. Nested savepoints exercise failed backfills without crossing ORM connections while schema locks are held.

- [Migration preservation, idempotency, and complete rollback](../../api/tests/db/migrations/migrate-child-care-spaces-from-worksheet-json.test.ts)
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
