# Services

Services own application operations that coordinate business rules or persistence. Controllers coordinate HTTP requests; they should pass authorized inputs to services and serialize the result.

Use the [Express Light Rail workflow](skill://express-light-rail/workflow.md) for shared backend feature guidance and the [Code Organization Reference — Service Orchestration Readability](https://github.com/klondikemarlen/marlens-skills-rules-and-tools/blob/main/docs/references/code-organization-reference.md#service-orchestration-readability) for service structure. This README records the ELCC-specific service and data constraints.

## ELCC conventions

- Call services through their static `perform(...)` entry point; construct a service only inside that implementation. Action inputs belong to the constructor and instance `perform()` executes the operation, following ELCC's `BaseService` convention.
- Keep authorization in policies and response formatting in serializers.
- Use Sequelize model scopes and helpers for persistence. Prefer `findEach()` when results are only iterated and select only consumed attributes; use `findAll()` when the workflow needs a reusable collection or returns the complete result.
- For array-backed JSON transformations, build a new array with `map()` and persist it through `update({ field: newValue })` rather than mutating the loaded array or calling `save()`.
- Funding amounts are decimal strings: use `Big` for arithmetic and preserve the established four-decimal representation with `toFixed(4)`. For funding-submission-line JSON, preserve the existing structure and fields while transforming the targeted lines; do not replace these domain-specific transformations with generic JSON handling.

The shared workflow and reference govern other service design decisions. Keep code-specific implementation details with the service and its tests.
