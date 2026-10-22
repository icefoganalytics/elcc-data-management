# Composables

This directory holds shared Vue composables. Follow the singular/plural split for data-access composables.

Keep singular and plural model-mirror composables while the underlying model exists, even when they have no current callers. Changing a screen's editor implementation does not make its model mirrors obsolete; remove them only when the underlying model is removed.

## Singular Composables

Use `use-model.ts` for one record identified by an id.

- Accept `Ref<number | null | undefined>`
- Fetch with `modelApi.get(id)`
- Return a single record, policy, loading state, and error state
- Provide `save()` for updates when applicable
- Re-fetch automatically when the id changes

Keep these composables focused on reactive model access and straightforward model actions. Screen-specific drafts, queued edits, autosave, and Retry feedback belong in the consuming component; see [component responsibilities](../components/README.md#model-access-and-editing).

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

Clear previous results while a new query context loads and ignore older responses. Mutation workflows belong in the consuming component, not in the collection composable.

## Naming

- Use singular names for single-record composables: `useUser`
- Use plural names for collection composables: `useEmployeeBenefits`
- Keep exported types near the composable when they come from the matching API module
