---
description: ELCC-specific workflow for adding an administration CRUD feature across the API and Vue UI.
auto_execution_mode: 1
---

# Create Admin UI Workflow

Use this recipe when an ELCC model needs an administration UI and its API is missing or incomplete. Keep the workflow discoverable here; use the applicable shared standards for generic authoring rather than copying their templates:

- Backend: [Express Light Rail workflow](skill://express-light-rail/workflow.md).
- Vue: [Vue Component Authoring Reference](https://github.com/klondikemarlen/marlens-skills-rules-and-tools/blob/main/docs/references/vue-component-authoring-reference.md), [Vue Vuetify CRUD templates](https://github.com/klondikemarlen/marlens-skills-rules-and-tools/blob/main/docs/templates/frontend/vue-vuetify-crud/README.md), and its [admin resource pages template](https://github.com/klondikemarlen/marlens-skills-rules-and-tools/blob/main/docs/templates/frontend/vue-vuetify-crud/admin-resource-pages-template.md).

Resolve these direct sources in the same available MSSRT release selected under [root guidance](/AGENTS.md#shared-standards-and-local-authority), not by re-entering skill selection. Follow local ELCC docs and the nearest live implementation where they define project-specific behavior; the [FundingRegion implementation](/api/src/models/funding-region.ts) and its connected API and UI files are current examples, not a static template or required architecture.

## ELCC implementation

Start with the actual model, relationships, business rules, nearby tests, and administration screens. Confirm which CRUD actions the resource needs; do not add routes, metrics, or UI actions merely because a generic template lists them. Preserve the boundary between mutable configuration and period-specific ledger values: see [Ledger vs Template Model Pattern](../../api/src/models/README.md#ledger-vs-template-model-pattern). Do not change historical or financial behavior as incidental UI work.

### API and persistence

Implement the needed API slice through the existing ELCC layers: routes in `api/src/router.ts`, controller in `api/src/controllers/`, policy in `api/src/policies/`, domain mutations in `api/src/services/`, response shaping in `api/src/serializers/`, and Sequelize model/registration where required. Read the [controller](../../api/src/controllers/README.md), [policy](../../api/src/policies/README.md), [service](../../api/src/services/README.md), and [serializer](../../api/src/serializers/README.md) conventions alongside sibling code.

- API routes use `/api/{resource-plural}` and `/api/{resource-plural}/:resourceSingularId`; register them after `/api` authentication middleware. Follow the existing GET/POST collection and GET/PATCH/DELETE item pattern only for supported actions.
- Controllers extend `BaseController<Model>`. Collection queries combine supported request filters/scopes with policy visibility, ordering, and pagination; client filters must not replace authorization. Check record existence and action authorization before reads or writes as appropriate.
- Policies own action authorization and permitted-attribute allowlists. Fail closed when access is not established. Do not expose unfiltered request bodies or raw model internals as a shortcut.
- Keep multi-step/domain mutations in services, and use explicit serializers for API output. Match the existing resource response envelope (for example `{ fundingRegions, totalCount }` for a list and `{ fundingRegion, policy }` for a show); define and test the new resource's contract rather than assuming this envelope or a universal status/error scheme.
- Follow ELCC Sequelize decorators, model registration, indexes, scopes, soft-delete behavior, timestamp defaults, associations, and database types from relevant models. Do not assume every model needs `excludingIds`, search, or the same scope; implement only supported query behavior. Financial decimal values are strings in the API/UI, not JavaScript numbers.
- Add API/controller/service/model tests at the layer owning the behavior, including authorization and relevant filtering/validation boundaries. Use existing test factories and the documented development/test wrapper rather than invented database or test-image commands.

### Vue administration UI and API client

Use `web/src/api/` for the typed HTTP contract, `web/src/use/` for model-mirror access where appropriate, feature components under `web/src/components/{resource-plural}/`, and pages under `web/src/pages/administration/`. The current FundingRegion UI is a useful example of this layout; `ChildCareSpaceCategory` is a nearby example with additional domain-specific form behavior.

- Keep the API types aligned with serializer fields and actual create/update attributes. Define query, filter, policy, and distinct index/show types only where the resource contract needs them. API modules use the shared HTTP client and base query types.
- Use singular `use-{resource}.ts` and plural `use-{resources}.ts` model mirrors for single-record and collection access when appropriate. Keep screen-specific drafts and mutation workflows in the owning page/component, consistent with [component responsibilities](../../web/src/components/README.md#model-access-and-editing) and [composable conventions](../../web/src/use/README.md).
- Follow existing admin composition: list page `Administration{Resources}Page.vue`; singular detail/create/edit pages under `pages/administration/{resource-plural}/`; feature component names in PascalCase with a meaningful optional modifier and Vuetify-root suffix. Use `HeaderActionsCard`, `HeaderActionsFormCard`, `DescriptionElement`, `CurrencyInput`, and existing validation/snackbar helpers when they fit the feature.
- Route names follow the established forms, such as `administration/{Resources}Page` for the list and `administration/{resource-plural}/{Resource}Page`, `{Resource}NewPage`, and `{Resource}EditPage` for singular pages. Paths use `administration/{resource-plural}` and the `:resourceSingularId` parameter. Pass route props where existing pages do, and keep breadcrumbs and navigation targets consistent with route names.
- Add the sidebar item only when the resource belongs in administration navigation. Add a `QuickMetricsCard` count only when it is relevant to the admin landing page; do not treat either integration as mandatory CRUD boilerplate.
- Respect serialized policy in action visibility. Forms must validate, surface loading/error/success states, preserve failed edits, and show backend validation failures using established UI patterns. Confirm destructive actions. Unique-value availability checks are feature-specific; use a model scope/filter and exclusion rule only when the server API actually supports them.
- For list/search/table behavior, follow existing server-table and query-option patterns, including pagination and debounced search where useful. Keep loading, pending, and completed behavior observable in the UI rather than asserting captured intermediate state after later transitions.

## Completion

For the selected resource, wire and verify each required API and UI path end to end: list/search and pagination if applicable, permitted detail, create, update, and delete where supported. Cover route registration, policy enforcement, response shape, form validation, navigation/breadcrumbs, and relevant empty/loading/error states in tests or focused QA. Use the repository's documented `bin/dev` commands for verification; report the exact commands and observed results in the task/PR evidence.
