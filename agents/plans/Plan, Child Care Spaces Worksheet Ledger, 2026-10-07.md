# Plan: Child Care Spaces Worksheet Ledger

## Problem Statement

ELCC-80 moves the **Child Care Spaces** worksheet section out of the `funding_submission_line_jsons.values` JSON blob into a dedicated, per-centre, per-fiscal-month ledger table. The worksheet must retain its current data entry, cross-section propagation, estimate replication, chart, and reconciliation behavior while historical JSON-backed values are migrated without duplication.

## Current State Analysis

**Current implementation:**

- `FundingSubmissionLine.DEFAULTS` defines seven `Child Care Spaces` rows (`Infants` through `School Age (FT)`) with their monthly rates in `api/src/models/funding-submission-line-defaults.ts`.
- `Centres.FundingPeriods.FundingSubmissionLineJsons.BulkCreateService` copies every funding-submission-line, including Child Care Spaces, into each monthly worksheet JSON record.
- `FundingSubmissionLineJsonEditSheet.vue` groups all JSON lines and saves the full array back to the worksheet record. Its current index-based cross-section logic copies Child Care Spaces occupancy to the next two sections.
- `FundingLineValuesEnrollmentChart.vue` finds the latest non-zero Child Care Spaces values through the JSON-only `withChildOccupancyRate` scope.
- `CalculateEligibleExpensesPeriodAmountService` sums every JSON line’s `actualComputedTotal`; removing the Child Care Spaces JSON entries without a replacement read would reduce the reconciliation total.
- `ReplicateEstimatesService` copies the complete JSON payload forward and resets actual values. Once Child Care Spaces leaves that payload, it would no longer replicate those estimates.

**Related-system patterns:**

- Merged PR #100 introduced `BuildingExpense` as a per-centre/per-fiscal-period ledger, registered it in the model registry, provisioned it from the funding-period dependency workflow, surfaced it through a resource API, and displayed it on `MonthlyWorksheetPage.vue`.
- `EmployeeBenefit` is the simpler one-record-per-centre/per-fiscal-period ledger. Both it and `BuildingExpense` use a soft-delete-aware composite unique index, `byFundingPeriod` scope, fiscal-period association, bulk create/ensure services, initialization checks, and centre/funding-period cleanup.
- The existing `move-building-expenses-from-submission-lines-to-building-expenses` migration batches JSON records, resolves the corresponding fiscal period, writes ledger rows, then removes the migrated section from each JSON array. It is the direct migration precedent.
- PR #109 demonstrated that derived worksheet values and their tests belong in the funding-period provisioning and mutation services, rather than in controllers.

## Key Findings

1. **The new persistence granularity is one configured space line for one centre and fiscal period.** A single monthly record cannot preserve the seven independently named/rated rows. Use a soft-delete-aware unique index on `(centreId, fiscalPeriodId, fundingSubmissionLineId)`.
2. **Child Care Spaces is a ledger, not a live configuration lookup.** Persist `lineName` and `monthlyAmount` as snapshots alongside the source `fundingSubmissionLineId`; store editable estimated and actual occupancy rates, and persist computed totals derived from the snapshot rate and occupancy.
3. **The JSON cutover has four functional consumers beyond the editor.** Provisioning, estimate replication, the enrollment chart, and eligible-expense reconciliation must all move to the ledger. The JSON scope `withChildOccupancyRate` becomes dead code after the chart cutover.
4. **Cross-section propagation must be named, not positional.** `sections[1]` and `sections[2]` only happen to be the dependent sections while Child Care Spaces is JSON section zero. Replace that implementation with explicit target section names and keep totals refreshed after propagated rates change.
5. **Historical data requires an irreversible, batched data migration.** Copying from the old JSON and retaining that section would create two mutable sources of truth. Copy each historical Child Care Spaces line to the new table and rebuild the JSON array without it only after the line is safely represented in the ledger.

## Recommended Solution

### Dedicated Child Care Space ledger (Recommended)

**Rationale:**

It matches the project’s recent ledger extraction pattern, gives each monthly space row relational identity and constraints, removes the need to query SQL Server JSON for the chart and part of reconciliation, and leaves unrelated worksheet sections in the existing JSON model.

**Implementation:**

1. **Add the schema and model.**
   - Create a timestamped schema migration for `child_care_spaces` with `id`, foreign keys to `centres`, `fiscal_periods`, and `funding_submission_lines`, snapshots for `line_name` and `monthly_amount`, editable `estimated_child_occupancy_rate` and `actual_child_occupancy_rate`, derived `estimated_computed_total` and `actual_computed_total`, UTC timestamps, and `deleted_at`.
   - Add the partial unique index for active `(centre_id, fiscal_period_id, funding_submission_line_id)` rows and an index decorator with the project’s duplicate-record message pattern.
   - Add `ChildCareSpace` to the Sequelize registry and establish its `Centre` and `FiscalPeriod` associations. Give it a `byFundingPeriod` scope like `BuildingExpense` and a fiscal-year filter scope for the chart.
   - Compute both totals in a model hook with `big.js`, using the persisted `monthlyAmount` snapshot and the occupancy rates, so server persistence—not just the browser—enforces the total invariant.

2. **Provision new fiscal years from the existing seed-generated configuration.**
   - Add `centres/funding-periods/child-care-spaces/BulkCreateService` and `BulkEnsureService` plus exports. The ensure service must compare expected `(fiscalPeriodId, fundingSubmissionLineId)` pairs with persisted rows and create only missing pairs; a nonempty result is not proof that a partially provisioned ledger is complete.
   - Resolve the funding period’s fiscal periods and legacy funding year, select only `FundingSubmissionLine` records with `sectionName === "Child Care Spaces"`, and create one zeroed ledger row for each selected line in each fiscal period. Copy the configured line name and monthly amount into the new rows.
   - Register this ensure step in `EnsureChildrenService` and include a `hasChildCareSpaces` check in `IsInitializedService`; a fiscal year is not initialized until the ledger exists.
   - Exclude Child Care Spaces from `FundingSubmissionLineJsons.BulkCreateService`, so new worksheets retain only JSON-owned sections.

3. **Migrate existing worksheet data and remove the old source.**
   - Add a separate timestamped data migration after the schema migration, following the batched `move-building-expenses-from-submission-lines-to-building-expenses` structure.
   - For each worksheet JSON record, isolate `sectionName === "Child Care Spaces"`, resolve its fiscal period from the legacy fiscal year and lower-case month, and create an idempotent ledger row for each source `submissionLineId`.
   - Preserve the existing line-name/rate snapshots and rate inputs; calculate both persisted totals with the same decimal formula used by the model. Do not infer rows from today’s configuration.
   - Rebuild that JSON record from the non-Child-Care-Spaces entries only after its values have been represented in the new table. Warn and retain the source JSON if no matching fiscal period or required source configuration can be found. Make `down` a documented no-op warning, as with the Building Expenses extraction.

4. **Expose the ledger through the existing resource rails.**
   - Add controller, policy, serializers, service exports, routes, and a typed web API client/composable for list/show/update operations. Provisioning owns creation and deletion; worksheet users can update only the two occupancy-rate inputs, never identifiers, snapshots, or computed totals.
   - Return the snapshot fields, totals, fiscal-period reference needed by the chart, and policy with the records. Support `centreId` + `fiscalPeriodId` for one worksheet and a scoped fiscal-year query for the latest enrollment chart; do not make the chart issue twelve month requests.
   - Add a namespaced Child Care Spaces estimate-replication endpoint/service. It copies source estimates to later fiscal periods in the same funding period for matching `fundingSubmissionLineId`, and resets actual rate/total to zero. Keep the existing worksheet JSON replication endpoint for the sections that remain JSON-backed.

5. **Compose the worksheet from both stores without regressing editing behavior.**
   - Have `MonthlyWorksheetPage.vue` resolve the fiscal period first and provide it to the editor. The editor loads Child Care Spaces for that centre/month and combines its display rows with JSON-owned sections in the same section order.
   - On **Save**, update Child Care Spaces through its resource API and submit only the non-Child-Care-Spaces lines to `FundingSubmissionLineJsons`. Refresh both resources after success.
   - Replace index-based propagation with an explicit mapping from `Child Care Spaces` to `Administration (10% of Spaces)` and `Quality Enhancement Program`. Match the source and each target by the shared `lineName`, fail loudly if a required target is missing or ambiguous, copy both occupancy rates, and refresh each affected computed total. This preserves the present business rule regardless of source or section ordering.
   - On **Replicate Estimates**, save both stores, run both replication operations, and refresh the editor. Surface either failure rather than claiming a complete replicate.

6. **Move reporting reads and delete obsolete JSON behavior.**
   - Change `FundingLineValuesEnrollmentChart.vue` to read the latest actual Child Care Spaces ledger rows for the requested centre/fiscal year; use their `lineName` and `actualChildOccupancyRate` directly.
   - Change `CalculateEligibleExpensesPeriodAmountService` to sum JSON-owned worksheet totals plus `child_care_spaces.actual_computed_total` for the requested `centreId` and `fiscalPeriodId`, then add Building Expenses. This replaces the fragile date-name/fiscal-year lookup for the extracted section while retaining remaining JSON-backed funding rows.
   - Delete the JSON model’s `withChildOccupancyRate` scope and its web filter type after the chart no longer uses it. Keep the generic JSON line type only for the sections it still represents.
   - Add Child Care Spaces to centre and funding-period destruction before its parent records are removed.

7. **Document the visible/schema change.**
   - Add an `Unreleased` CHANGELOG entry for the dedicated Child Care Spaces monthly ledger and worksheet preservation.

## Alternative Considered

### Retain Child Care Spaces inside JSON and add a read-only mirror table

**Rationale:**

It avoids rewriting the editor and chart immediately.

**Rejected:**

The worksheet would have two mutable copies of the same occupancy values, reconciliation could read a different source than the editor, and historical corrections could drift. It fails the requested dedicated model/table cutover.

## Decision Factors

1. One authoritative mutable record per centre, month, and seeded Child Care Spaces line.
2. Existing historical worksheet data remains available with the same rates, occupancy values, totals, and section propagation behavior.
3. Chart and reconciliation results remain correct after JSON entries are removed.
4. The change stays bounded to Child Care Spaces; unrelated JSON worksheet sections are not normalized in this ticket.

## Files to Change

| File or area                                                                                           | Change                                                                                                 |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `api/src/db/migrations/`                                                                               | Schema migration and separate batched JSON-to-ledger data migration.                                   |
| `api/src/models/child-care-space.ts` and `api/src/models/indexes/`                                     | Ledger model, calculated totals, associations, scopes, and unique index.                               |
| `api/src/models/{centre,fiscal-period,index}.ts`                                                       | Register model associations and Sequelize setup.                                                       |
| `api/src/services/centres/funding-periods/child-care-spaces/`                                          | Bulk create/ensure and estimate replication services.                                                  |
| `api/src/services/centres/funding-periods/{ensure-children,is-initialized}-service.ts`                 | Provision and require the ledger with the other child records.                                         |
| `api/src/services/centres/{destroy}-service.ts`, `api/src/services/funding-periods/destroy-service.ts` | Remove dependent ledger rows before parent records.                                                    |
| `api/src/services/centres/funding-periods/funding-submission-line-jsons/bulk-create-service.ts`        | Omit the extracted section from newly created JSON worksheets.                                         |
| `api/src/services/funding-reconciliations/calculate-eligible-expenses-period-amount-service.ts`        | Add Child Care Spaces ledger totals to remaining JSON totals.                                          |
| `api/src/controllers/`, `api/src/policies/`, `api/src/serializers/`, `api/src/router.ts`               | Resource API and namespaced replication endpoint.                                                      |
| `web/src/api/`, `web/src/use/`                                                                         | Child Care Spaces types, client, and reactive query hook.                                              |
| `web/src/pages/child-care-centres/worksheets/MonthlyWorksheetPage.vue`                                 | Supply the resolved fiscal period and coordinate both worksheet data sources.                          |
| `web/src/components/funding-submission-line-jsons/FundingSubmissionLineJsonEditSheet.vue`              | Compose, save, replicate, and propagate named sections correctly.                                      |
| `web/src/components/funding-line-values/FundingLineValuesEnrollmentChart.vue`                          | Query the ledger instead of JSON.                                                                      |
| `api/tests/` and `web/tests/`                                                                          | Regression coverage for persistence, migration, cross-section propagation, reporting, and replication. |
| `CHANGELOG.md`                                                                                         | User-facing `Unreleased` entry.                                                                        |

## Verification Plan

1. **Model and provisioning tests:** Verify the unique key, server-side total calculation, all seven seeded space lines × all fiscal periods, zero defaults, and no Child Care Spaces lines in newly created JSON worksheets.
2. **Migration test/rehearsal:** Seed a worksheet with Child Care Spaces and another section; run the migrations; assert ledger snapshots/rates/totals, retained non-Child JSON entries, no duplicate active rows, and safe handling of an unresolved fiscal period.
3. **Workflow-service tests:** Verify initialization requires/provisions Child Care Spaces, centre/funding-period cleanup removes them, and replication copies estimates while clearing actuals for later months only.
4. **Reconciliation and chart tests:** Assert the reconciliation amount equals remaining JSON actual totals + Child Care Spaces `actualComputedTotal` + Building Expenses, and that the enrollment chart receives the latest ledger rates for its fiscal year.
5. **Worksheet component test:** Exercise a Child Care Spaces edit, explicit propagation to Administration and Quality Enhancement Program by section name, separated save payloads, and dual replication requests. This protects the source-order regression created by the extraction.
6. **Release smoke:** Run the focused API and web tests through `bin/dev`, run API/web type checks, boot the worktree with `bin/dev up`, edit/save a Child Care Spaces value, confirm dependent section totals, use **Replicate Estimates**, verify the enrollment chart, and refresh the monthly reconciliation total.

## Related Issues

- [ELCC-80: Model Child Care Spaces worksheet section per centre and month](https://yg-hpw.atlassian.net/browse/ELCC-80)
- Merged [PR #100](https://github.com/icefoganalytics/elcc-data-management/pull/100): Building Expenses extraction and per-centre/per-month ledger pattern.
- Merged [PR #109](https://github.com/icefoganalytics/elcc-data-management/pull/109): Funding Submission Line JSON provisioning and mutation behavior.
