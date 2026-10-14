# Services

Services hold business logic for create and update workflows. Controllers should coordinate requests, but services should own multi-step mutations.

## Responsibilities

- Validate and normalize complex input before persistence
- Encapsulate create and update workflows
- Keep database mutations and business rules out of controllers
- Return the created or updated model so controllers can serialize the result

## Guidelines

- Prefer `CreateService` and `UpdateService` classes when the pattern matches existing code
- Pass the minimum data needed rather than whole request objects
- Keep authorization in policies and response formatting in serializers
- Reuse model scopes and helpers instead of duplicating query logic in services
- When a small piece of service logic repeats, do not over-generalize it into a shared helper unless the ownership and reuse boundary are clear

## Implementation Patterns

### Immutable Data Transformations
- Use `map()` to create new arrays instead of mutating existing arrays in place
- Use `update({ field: newValue })` instead of `save()` when modifying model data
- Pattern: `const newLines = lines.map(line => { ...transform logic... }); await model.update({ lines: newLines })`
- Rationale: Follows immutable pattern like Big.js, avoids side effects, makes data flow clearer
- Apply to services that transform array data (e.g., funding submission line JSON lines)
