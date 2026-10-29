# Composables

This directory holds shared Vue composables. Follow the singular/plural split for data-access composables.

Keep singular and plural model-mirror composables while the underlying model exists, even when they have no current callers. Changing a screen's editor implementation does not make its model mirrors obsolete; remove them only when the underlying model is removed.

Cancel superseded reads with `AbortController`, passing its `signal` through the API module to Axios. Abort pending reads when watching is skipped, the selected id is cleared, or the consuming scope is disposed. Cancellation is not a load failure, and an aborted request must not change the replacement request's loading or error state. Do not cancel committed writes when the selected context changes.

Use Vue's default watcher scheduling to batch related state changes. Do not use `flush: "sync"` as a general freshness or cancellation mechanism; an exception needs a demonstrated local ordering requirement.

Watcher callbacks should await `fetch()` directly. Fetch actions may record load errors before rethrowing; do not add catch-and-ignore wrappers merely because the error state was updated.

## Singular Composables

Use `use-model.ts` for one record identified by an id.

- Accept `Ref<number | null | undefined>`
- Fetch with `modelApi.get(id)`
- Return a single record, policy, loading state, and error state
- Provide `save()` for updates when applicable
- Re-fetch automatically when the id changes

Keep these composables focused on reactive model access and straightforward model actions. Screen-specific drafts, queued edits, autosave, and Retry feedback belong in the consuming component; see [component responsibilities](../components/README.md#model-access-and-editing).

Keep record deletion in the consuming page or component: call the model API's `delete(id)` directly and own confirmation, pending state, feedback, and navigation there.

Consume those returned refs directly. A component should not mirror the composable's records in another map and reconcile each fetch into that map; preserve the editor's lifetime when its pending work must survive navigation.

Clear the previous record when its id changes and ignore outdated responses. Group cancellation and record-state resets in a local `clearRecord()` helper, as in `useEmployeeBenefit`, and call it from the id watcher before fetching. Loading state belongs to the latest request; an earlier request must not end the current loader or restore an old record. In-flight saves must not update a different record's local state.

## Plural Composables

Use `use-models.ts` for list and query operations.

- Accept `Ref<QueryOptions>`
- Fetch with `modelApi.list(queryOptions)`
- Return an array, `totalCount`, loading state, and error state
- Support reactive filters, pagination, and optional fetch-skipping logic
- Re-fetch automatically when query options change

Keep query watchers focused on awaiting `fetch()`. Let `fetch()` publish the collection and count together when the response arrives; consumers use loading and error state to decide when records are ready for interaction. Ignore outdated responses. Mutation workflows belong in the consuming component, not in the collection composable.

## Naming

- Use singular names for single-record composables: `useUser`
- Use plural names for collection composables: `useEmployeeBenefits`
- Keep exported types near the composable when they come from the matching API module
