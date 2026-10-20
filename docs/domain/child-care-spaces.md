# Child Care Spaces

Child Care Spaces records monthly occupancy and its funding amounts for a child care centre.

## Record identity and historical facts

One active record represents one centre, one fiscal month, and one Child Care Space category. Soft-deleted records do not occupy that unique identity.

The line name and monthly amount are snapshots, not live category lookups. Ordinary category edits and soft deletion preserve existing monthly facts. Explicit forward application can revise eligible snapshots under the rules below. Worksheet users can correct estimated and actual occupancy; identifiers, snapshots, and calculated totals are not editable through the worksheet API.

## Category configuration

Each funding period owns its configurable category names, optional age ranges, and monthly amounts. **Administration → Child Care Space Categories** manages this configuration separately from the remaining funding submission lines. Only system administrators can create, update, retire, or forward-apply categories; authenticated worksheet users retain category reads and occupancy editing. A category's funding period is selected when created and cannot be changed through an update.

Category editors clear the previous record when navigating to another category. Late load or save responses cannot replace the currently requested record, and saving requires that record's identity to match the route.

New funding periods copy active categories from the latest active fiscal year with categories, or use the seven original categories when none exist. Ensuring an already configured period retains its categories unchanged, including a deliberately empty configuration whose categories were all retired. Without explicit forward application, revised names and rates apply only to newly provisioned ledger rows. Removing a category retires its configuration without deleting historical ledger rows.

## Forward application

Create and Edit offer an unchecked **Apply to existing centre worksheets from a selected month onward** option. When enabled, **Apply From Month** is required and must belong to the category's funding period.

- The selected month is included; earlier months and other funding periods are unchanged.
- Missing category/month rows are created with zero occupancy for non-soft-deleted centres. Soft-deleted ledger pairs are not recreated.
- On Edit, existing rows receive the revised name and monthly amount only if their snapshots still match the previous category name and rate and actual occupancy is zero. Manual snapshot overrides and rows with actual occupancy remain unchanged.
- Estimated occupancy is retained and totals are recalculated using decimal arithmetic. Age ranges remain category configuration only.
- Category changes and forward application commit together or roll back together. This is not estimate replication and does not create Administration or Quality Enhancement Program configuration.

## Financial consistency

Estimated and actual totals each equal the snapshotted monthly amount multiplied by the corresponding occupancy rate. Decimal arithmetic produces totals at four decimal places.

Category monthly amounts and occupancy inputs must be exactly representable at four decimal places. Excess precision is rejected, not silently rounded: at a monthly amount of `100.0000`, occupancy `0.1234` produces `12.3400`; `0.12345` is rejected. Changing only the estimate must not change the actual total.

Occupancy saves and estimate replication reload ledger inputs within a database transaction before calculating totals. A stale editor cannot calculate a total from a rate that category propagation has already replaced. Category updates also reload and lock their current configuration before capturing the propagation baseline, so an earlier request's propagated snapshots are not mistaken for manual overrides.

## Provisioning and initialization

First-time centre/funding-period setup creates zeroed records for every active Child Care Space category in every fiscal month. Shared ensures provision these rows only when no other initialization records or ledger history exist for that centre and funding period. Later ensures and seeds do not fill intentionally absent category/month pairs or restore retired pairs.

Initial provisioning creates the configured monthly records. Afterward, worksheet access depends on the existing employee-benefit, building-expense, worksheet, and reconciliation setup, not the current category catalogue's completeness. Adding a category without propagation or starting in a later month does not block an initialized centre or force records into earlier months.

## Worksheet and reporting rules

- Occupancy edits propagate to **Administration (10% of Spaces)** and **Quality Enhancement Program** through the stable category ID stored on their configuration and worksheet lines, not through editable labels or section position. Both estimated and actual occupancy are copied and dependent totals refreshed. Missing or ambiguous matches are errors.
- **Replicate Estimates** copies estimates to matching lines in later months of the same funding period and centre. It clears those months' actual occupancy and actual totals; earlier months and other centres are unaffected.
- **Latest Enrollment** uses the latest month with positive actual occupancy in the selected centre and fiscal year, including every category from that month. Empty future months must not hide earlier enrollment. Without positive actual occupancy, there is no enrollment chart.
- Eligible expenses combine remaining worksheet JSON actual totals, Child Care Spaces ledger actual totals, and Building Expenses for the requested centre and fiscal period. Child Care Spaces must not also be stored in worksheet JSON.
- Removing a funding period removes its Child Care Spaces records without removing another period's records.
- The worksheet mounts only after its centre, fiscal year, month, worksheet, and fiscal period agree. Delayed responses from earlier navigation cannot restore another month's editor.
- Occupancy inputs remain read only throughout **Save** and **Replicate Estimates**, including until every dispatched write settles after a sibling fails. A failed ledger batch does not trigger the dependent worksheet JSON save.
- The worksheet withholds editing when either its ledger or JSON source fails to load. **Reload Worksheet** reloads both sources before restoring editing.

## Sources

- [Model and financial calculations](../../api/src/models/child-care-space.ts)
- [Category configuration](../../api/src/models/child-care-space-category.ts)
- [Category provisioning](../../api/src/services/funding-periods/child-care-space-categories/bulk-create-service.ts)
- [Editable attributes](../../api/src/policies/child-care-space-policy.ts)
- [Initialization rules](../../api/src/services/centres/funding-periods/is-initialized-service.ts)
- [Provisioning regression coverage](../../api/tests/services/centres/funding-periods/child-care-spaces/bulk-create-service.test.ts)
- [Worksheet persistence and cutover architecture](../architecture/monthly-worksheet-persistence.md)
