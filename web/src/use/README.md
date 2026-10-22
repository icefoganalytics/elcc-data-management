# Composables

This directory holds shared Vue composables. Follow the singular/plural split for data-access composables.

## Singular Composables

Use `use-model.ts` for one record identified by an id.

- Accept `Ref<number | null | undefined>`
- Fetch with `modelApi.get(id)`
- Return a single record, policy, loading state, and error state
- Provide `save()` for updates when applicable
- Re-fetch automatically when the id changes

Record-specific editing and persistence belong in the singular composable, not the consuming
component. Keep persisted attributes, pending changes, save serialization, and retry errors
private; expose actions and the loading/saving/error state the UI needs. Components retain
display calculations and transient editor state.

Clear the previous record when its id changes and ignore outdated responses. Loading state
belongs to the latest request; an earlier request must not end the current loader or restore
an old record. In-flight saves must not update a different record's local state.

An editing owner can retain record-local queues while its mounted page changes the selected month. Hide unresolved record views without destroying that owner. Serialize committed changes for the same record, retain failed drafts for Retry, and reconcile returning loads with writes that completed while the request was pending. Keep this state local to the owning editor; it is not an application-wide cache.

## Plural Composables

Use `use-models.ts` for list and query operations.

- Accept `Ref<QueryOptions>`
- Fetch with `modelApi.list(queryOptions)`
- Return an array, `totalCount`, loading state, and error state
- Support reactive filters, pagination, and optional fetch-skipping logic
- Re-fetch automatically when query options change

When one table edits multiple records, a domain-specific editing composable can own the table's collection and mutations together. Tier or row components then display resolved records and emit user actions; they do not maintain a second persistence snapshot. Collection discovery must clear previous results while a new context loads and ignore older responses.

## Naming

- Use singular names for single-record composables: `useUser`
- Use plural names for collection composables: `useEmployeeBenefits`
- Keep exported types near the composable when they come from the matching API module
