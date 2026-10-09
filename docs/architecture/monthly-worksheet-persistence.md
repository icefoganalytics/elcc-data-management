# Monthly Worksheet Persistence

A monthly worksheet combines records with different persistence owners. The shared presentation does not make worksheet JSON the owner of every displayed section.

## Persistence ownership

| Worksheet data                                                                           | Authoritative store                                                                   | Save boundary                                                                |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Child Care Spaces                                                                        | `child_care_spaces`, identified by centre, fiscal period, and funding submission line | Only the two occupancy inputs are updated through the Child Care Spaces API. |
| Remaining JSON-backed sections, including Administration and Quality Enhancement Program | `funding_submission_line_jsons.values`                                                | The worksheet JSON API receives only its own sections.                       |

The [JSON model](../../api/src/models/funding-submission-line-json.ts) attaches the named [Child Care Spaces exclusion validator](../../api/src/models/validators/does-not-contain-child-care-spaces.ts) to `values`, covering both virtual `lines` and raw `values` writes. This prevents clients opened before a deployment from reintroducing a second copy and double-counting reconciliation. The model imports this model-dependent validator directly; the shared validator barrel remains independent of model initialization.

The [worksheet editor](../../web/src/components/funding-submission-line-jsons/FundingSubmissionLineJsonEditSheet.vue) composes both stores for display, persists changed ledger rows before saving JSON-owned lines, and refreshes both resources after success. **Replicate Estimates** first saves, then invokes each store's replication operation.

These are separate API requests, not one worksheet-wide transaction. A save or replication failure is surfaced, but completed requests are not rolled back across stores. Each [Child Care Spaces replication operation](../../api/src/services/child-care-spaces/replicate-estimates-service.ts) does transact its own later-month updates.

Occupancy edits and estimate replication use the standard `update()` authorization action on the [Child Care Spaces policy](../../api/src/policies/child-care-space-policy.ts).

## Historical JSON cutover

The [data migration](../../api/src/db/migrations/2026.10.07T17.43.15.migrate-child-care-spaces-from-worksheet-json.ts) processes active worksheets in batches. It resolves their fiscal month and preserves each source line's name, monthly amount, occupancy inputs, and matching supplied totals; absent totals are calculated. Source configuration is resolved by persisted ID, including changed or soft-deleted configuration.

All source values must be represented before their JSON section is removed. Matching existing ledger rows make success idempotent. Conflicts, duplicate or malformed lines, unresolved references or periods, inconsistent totals, and lossy decimal conversion abort the migration. The [migration resolver](../../api/src/db/utils/sequelize-auto-transaction-resolver.ts) rolls back the entire data migration, including earlier inserts and JSON removal.

This fail-closed cutover is essential: retaining a writable JSON copy while reporting from the ledger creates competing owners. A successful migration has no automatic data rollback; its `down` operation only warns. Restoring pre-cutover JSON requires the original data and manual restoration.

## Maintenance boundaries

- [Child Care Spaces domain rules](../domain/child-care-spaces.md) define historical identity, financial consistency, propagation, and reporting behavior.
- [Ledger/template and scope patterns](../../api/src/models/README.md) describe snapshot ownership and safe bulk-mutation predicates.
- [The enrollment chart](../../web/src/components/funding-line-values/FundingLineValuesEnrollmentChart.vue) reads the ledger by centre and fiscal year, ordered by fiscal-period start date.
- [Eligible-expense calculation](../../api/src/services/funding-reconciliations/calculate-eligible-expenses-period-amount-service.ts) combines the independent persistence owners; it must not reintroduce Child Care Spaces into the JSON sum.

## Regression evidence

These tests are executable evidence, not a claim that a particular release or authenticated browser scenario has passed:

- [Migration preservation, idempotency, and complete rollback](../../api/tests/db/migrations/migrate-child-care-spaces-from-worksheet-json.test.ts)
- [Financial persistence and precision](../../api/tests/models/child-care-space.test.ts)
- [Stale-client JSON rejection and accepted JSON-owned writes](../../api/tests/controllers/funding-submission-line-jsons-controller.test.ts)
- [Historical initialization](../../api/tests/services/centres/funding-periods/is-initialized-service.test.ts)
- [Estimate replication isolation](../../api/tests/services/child-care-spaces/replicate-estimates-service.test.ts)
- [Funding-period deletion isolation](../../api/tests/services/funding-periods/destroy-service.test.ts)
- [Eligible-expense composition](../../api/tests/services/funding-reconciliations/calculate-eligible-expenses-period-amount-service.test.ts)
- [Worksheet propagation, split saves, and replication](../../web/tests/components/funding-submission-line-jsons/FundingSubmissionLineJsonEditSheet.test.ts)
- [Latest enrollment with empty future months](../../web/tests/components/funding-line-values/FundingLineValuesEnrollmentChart.test.ts)
