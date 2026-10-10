# Child Care Spaces

Child Care Spaces records monthly occupancy and its funding amounts for a child care centre.

## Record identity and historical facts

One active record represents one centre, one fiscal month, and one Child Care Space category. Soft-deleted records do not occupy that unique identity.

The line name and monthly amount are snapshots, not live category lookups. Changing or soft-deleting a category does not rewrite an existing month's facts. Worksheet users can correct estimated and actual occupancy; identifiers, snapshots, and calculated totals are not editable through the worksheet API.

## Category configuration

Each funding period owns its configurable category names, optional age ranges, and monthly amounts. **Administration → Child Care Space Categories** manages this configuration separately from the remaining funding submission lines. A category's funding period is selected when created and cannot be changed through an update.

New funding periods copy active categories from the latest active fiscal year with categories, or use the seven original categories when none exist. Ensuring an already configured period retains its categories unchanged, including a deliberately empty configuration whose categories were all retired. Revised names and rates apply only when a new ledger row is provisioned; existing monthly snapshots and occupancy remain intact. Removing a category retires its configuration without deleting historical ledger rows.

## Financial consistency

Estimated and actual totals each equal the snapshotted monthly amount multiplied by the corresponding occupancy rate. Decimal arithmetic produces totals at four decimal places.

Occupancy inputs must be exactly representable at four decimal places. Excess precision is rejected, not silently rounded: at a monthly amount of `100.0000`, occupancy `0.1234` produces `12.3400`; `0.12345` is rejected. Changing only the estimate must not change the actual total.

## Provisioning and initialization

Provisioning creates zeroed records for every active Child Care Space category in every fiscal month of its funding period, adding only missing pairs.

Initialization requires all active category/month pairs, not equality between current category count and historical record count. Historical extras remain valid. An empty active category set needs no new records, but fiscal periods must still exist.

## Worksheet and reporting rules

- Occupancy edits propagate to **Administration (10% of Spaces)** and **Quality Enhancement Program** through the stable category ID stored on their configuration and worksheet lines, not through editable labels or section position. Both estimated and actual occupancy are copied and dependent totals refreshed. Missing or ambiguous matches are errors.
- **Replicate Estimates** copies estimates to matching lines in later months of the same funding period and centre. It clears those months' actual occupancy and actual totals; earlier months and other centres are unaffected.
- **Latest Enrollment** uses the latest month with positive actual occupancy in the selected centre and fiscal year, including every category from that month. Empty future months must not hide earlier enrollment. Without positive actual occupancy, there is no enrollment chart.
- Eligible expenses combine remaining worksheet JSON actual totals, Child Care Spaces ledger actual totals, and Building Expenses for the requested centre and fiscal period. Child Care Spaces must not also be stored in worksheet JSON.
- Removing a funding period removes its Child Care Spaces records without removing another period's records.
- The worksheet withholds editing when either its ledger or JSON source fails to load. **Reload Worksheet** reloads both sources before restoring editing.

## Sources

- [Model and financial calculations](../../api/src/models/child-care-space.ts)
- [Category configuration](../../api/src/models/child-care-space-category.ts)
- [Category provisioning](../../api/src/services/funding-periods/child-care-space-categories/bulk-create-service.ts)
- [Editable attributes](../../api/src/policies/child-care-space-policy.ts)
- [Initialization rules](../../api/src/services/centres/funding-periods/is-initialized-service.ts)
- [Provisioning regression coverage](../../api/tests/services/centres/funding-periods/child-care-spaces/bulk-create-service.test.ts)
- [Worksheet persistence and cutover architecture](../architecture/monthly-worksheet-persistence.md)
