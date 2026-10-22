---
description: Code Review Quality Control Workflow for TypeScript code in the ELCC project
---

# Code Review Quality Control Workflow

Use this workflow to review TypeScript code for the ELCC project. Apply every rule below as a hard gate — flag any violation as a blocking issue. For each issue found, quote the offending lines and state which rule they violate.

**Complete workflow sequence:** This is step 2 of 4 in the complete PR creation process. Always use after jira-issue-management workflow and before pull-request-management workflow to ensure code quality standards are met.

## Steps

1. **Review TypeScript Strictness**
   - No `any` — not in source, not in tests, not in casts
   - No `!` (non-null assertion) — use `isNil` / optional chaining / explicit guard clauses instead
   - No `@ts-ignore` or `@ts-expect-error`
   - No relative imports — always `@/...` path aliases. Exception: barrel `index.ts` files may use relative imports for re-exports

2. **Check Type Cast Placement**
   - Type casts with `as` must happen on assignment or creation, never at the point of use
   - **When a cast is needed at point of use, create a new type definition** that returns the correct type by design, eliminating the need for casts
   - Prefer proper type definitions over runtime type checks; only use guard clauses when runtime validation is genuinely needed, not just to satisfy TypeScript
   - A cast is only acceptable when the type system genuinely cannot infer a type that is known at runtime

3. **Review Human Readability**
   - Keep related behavior in cohesive modules with clear state and effect ownership.
   - Prefer straightforward control flow and guard clauses, with a blank line before the main path.
   - Do not split cohesive operations into trivial helpers merely to satisfy a nesting or complexity quota.

4. **Verify Test Completeness**
   - Every test must include explicit Arrange / Act / Assert comments and be fully self-contained
   - Keep test-specific data, mount options, and API responses inside each test; do not hide them behind local mount/payload helpers or shared fixtures. Reuse existing factories and infrastructure helpers when appropriate.
   - Use `beforeEach` for invariant environment or mock setup, not scenario data. Do not repeat mock resets already provided by the test runner.
   - Service test assertions should target database state, not service return values, unless the return value is specifically what is under test
   - Spy assertions — use `expect(spy).not.toHaveBeenCalled()` without arguments. Never use `not.toHaveBeenCalledWith(...)`

5. **Verify One Observable Behavior Per Test**
   - Assert directly on observable results; never construct synthetic summary objects just to force one `expect`.
   - Related facts proving the same behavior may use separate direct expectations in one final Assert section. Split independent behaviors into separate tests.
   - For HTTP responses, assert `response.status` first and `response.body` second with `toEqual(...)`; do not match the complete response object.
   - When asserting "not any of N values", split into N separate tests rather than looping.

6. **Check Test Naming**
   - Tests must follow `"when [condition], [expected behaviour]"` with full English words (no abbreviations)
   - Numbered entities in test bodies: `user1`, `user2`, `workflowStep1`, `workflowStep2` — never `existingUser`, `newUser`
   - Describe hierarchy must mirror the source file path

7. **Validate Failure Diagnostics**
   - Prefer concrete expected values and direct assertions on observable behavior.
   - Boolean assertions are appropriate for Boolean contracts, including visible loading and error states.
   - Avoid synthetic summary objects and compound Boolean assertions that hide the failing fact.

8. **Check Architecture Consistency**
   - When multiple classes serve similar purposes, ensure they have consistent APIs and clear differentiation in their type signatures
   - Preserve supported caller contracts when extending functionality; introduce a distinct type when the semantics actually differ.
   - **Ensure similar classes follow the same patterns**
   - Flag inconsistent naming or patterns between similar classes

9. **Check for Over-Engineering**
   - Flag additions that were not requested:
     - New abstractions, helpers, or utilities for a one-time use
     - Features, flags, or configurability that no current caller needs
     - Comments explaining what the code does when the names already say it
     - Error handling for states that cannot be reached

10. **Check for Orphaned or Non-Sensical Code**
    - Flag functions, methods, or code paths that serve no purpose
    - Look for placeholder implementations that never get called
    - Identify dead code paths or unreachable logic
    - **Flag code with comments like "legacy path" or "no-op here" that should be removed**
    - **When removing features, remove all related types, imports, and exports** - don't leave partially implemented type systems
    - Verify that all exported functions are actually used somewhere in the codebase

11. **Validate Import Organization**
    - Group imports by conceptual distance, separating third-party packages, standard-library modules, and local application imports.
    - Keep utilities, API clients, composables, and components together by project convention.
    - Use one import statement per module and remove unused imports. Do not reorder unrelated imports solely to satisfy an alphabetical rule.

12. **Check Naming Conventions**
    - No abbreviations — `workflow` not `wf`, `migration` not `mig`
    - Fully qualified names at public boundaries — when data crosses a boundary (API response, email template, event payload), prefix with the parent model name to disambiguate
    - SQL — fully spell out table and column names; no abbreviated aliases
    - Function names — describe both trigger and behavior

13. **Verify Expanded Style**
    - Prefer explanatory names, readable spacing, and explicit steps over dense expressions.
    - Keep a concise expression when it is the clearest form; do not extract single-use variables or helpers mechanically.
    - Name constants when they express a domain rule, not every literal.

14. **Check Service Pattern**
    - Services encapsulate business logic and are invoked exclusively via their static `perform()` method
    - Never instantiate a service directly outside of its own `static perform()` implementation
    - Red flags: `new SomeService(...)` at a call site, business logic in a controller that belongs in a service, a service calling a query directly instead of delegating to another service

## Output Format

For each issue:

```
[RULE N] <rule name>
File: <path>:<line>
> <quoted offending code>
Fix: <one-sentence description of what to change>
```

After listing all issues, conclude with one of:

- **APPROVED** — no blocking issues found.
- **CHANGES REQUESTED** — N blocking issues listed above.

## Related Workflows

- [`./jira-issue-management.md`](./jira-issue-management.md) - Creating well-structured Jira issues
- [`./pull-request-management.md`](./pull-request-management.md) - Create and update pull requests
- [`./testing-instructions.md`](./testing-instructions.md) - Generate comprehensive testing instructions for pull requests
