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

## Plural Composables

Use `use-models.ts` for list and query operations.

- Accept `Ref<QueryOptions>`
- Fetch with `modelApi.list(queryOptions)`
- Return an array, `totalCount`, loading state, and error state
- Support reactive filters, pagination, and optional fetch-skipping logic
- Re-fetch automatically when query options change

## Naming

- Use singular names for single-record composables: `useUser`
- Use plural names for collection composables: `useEmployeeBenefits`
- Keep exported types near the composable when they come from the matching API module
