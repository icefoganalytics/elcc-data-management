# Components

Use this directory for reusable UI building blocks. Keep feature-specific details in the feature folder, but document cross-cutting component patterns here.

For generic Vue structure and authoring, use the [shared Vue Component Authoring Reference](https://github.com/klondikemarlen/marlens-skills-rules-and-tools/blob/main/docs/references/vue-component-authoring-reference.md); the conventions below describe ELCC's component boundaries, editing ownership, and naming.

## Responsibilities

- Prefer dedicated pages over dialogs for complex workflows.
- Parent components should discover records. Child components should edit or display a specific record.
- When lookups are complex, the parent absorbs that complexity and passes stable identifiers or already-resolved state to the child.
- When action visibility depends on page context, compute that state in the parent page and pass a simple boolean prop down to the child component.
- Handle loading, empty, error, and success states explicitly.

## Resource Inputs

Use a model-specific `SearchableAutocomplete` component for selecting persisted records instead of an inline page/form `v-select`. Reuse an existing model input before adding another. Plain selects are appropriate for small, fixed option sets such as roles.

Follow the searchable autocomplete pattern in [FundingPeriodSearchableAutocomplete](funding-periods/FundingPeriodSearchableAutocomplete.vue): debounced server-side search, bounded pagination, `no-filter`, and a separate selected-record lookup merged into the results so its label survives search and page changes. The input owns fetching/loading/error presentation through its model composables; the parent provides contextual filters and owns form-specific dependent-field resets.

## Model Access and Editing

Use model-mirror `use-*` composables for reactive fetching, record or collection state, loading/errors, and straightforward single-record saves. Components own their editing workflows: draft values, dirty tracking, autosave queues, mutation handlers, Retry state, and user feedback.

For an autosaving table, consume the record or collection refs returned by its model composable directly. Do not copy them into a parallel record store or watch fetched records to merge fields and revision counters.

Keep pending commands and failed-input feedback local to the owning component. If drafts must survive month navigation, retain keyed editor instances with `KeepAlive` for the mounted page instead of changing a single editor's record identity and reconciling returning fetches. Each instance keeps its model ref and queue; committed writes continue while it is inactive.

Refresh a retained wage editor's collection when it becomes active and has no pending mutation or failed edit. This keeps replicated estimates visible without overwriting local input that still needs saving.

Parent tables may discover collections and own their mutations while row or tier components display resolved records and emit actions. Keep one model source and one editing owner, not a second persistence snapshot in each child or a global editor cache.

## Naming and Location

- Directory names are plural and kebab-case: `components/employee-benefits/`
- Component names are PascalCase and use singular or plural based on the entity count:
  - `EmployeeBenefitCard.vue`
  - `EmployeeBenefitsDataTable.vue`
- Use an optional modifier only when it adds meaning:
  - `Edit`, `Manage`, `Create`, `Server`
- ELCC naming exception: suffix the name with the outermost Vuetify component, preserving the established feature-directory convention rather than mechanically adopting a generic semantic-root suffix:
  - `Dialog`, `DataTable`, `Table`, `Card`, `Form`

Pattern:

```text
components/{model-plural}/{ModelSingularOrPlural}[Modifier]{VuetifyComponent}.vue
```

## Event Handlers

- Name functions for the action performed, not the DOM event.
- Prefer `startEditingRow`, `saveAndExitEditMode`, and `handleKeyboardNavigation` over `onClick`, `onBlur`, or `onKeyDown`.
- Call action functions directly from the template when the event wrapper adds no value.

## Tables

- When hiding an optional actions column, remove it from the `headers` list instead of rendering an empty column and then hiding the button inside the cell template.
- Keep row-level action gating separate from page-level action-column gating. For example, the page may hide the entire actions column while a row still checks `item.policy.destroy`.
