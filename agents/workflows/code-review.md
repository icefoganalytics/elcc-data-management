# ELCC Review Constraints

Shared base: `skill://code-review/workflow.md` from MSSRT. Load that direct document first, then apply this overlay under [root authority](/AGENTS.md#shared-standards-and-local-authority). The shared owner maintains generic readability, test focus, assertion quality, and review reporting; do not restore a local nesting or expectation-count quota.

## Local Constraints

- TypeScript: no `any`, non-null assertions, `@ts-ignore`, or `@ts-expect-error`. Use `@/` imports; barrel `index.ts` re-exports may use relative paths so they can bundle siblings.
- Permit `as` assertions only when the type system cannot infer a runtime-known type, at assignment/creation rather than at use. Correct the owning type first when possible; retain runtime guards for genuinely untrusted input.
- Financial precision, funding/history invariants, and SQL conventions remain in [root guidance](/AGENTS.md), [domain knowledge](/docs/README.md), and the nearest model/database documentation.
- Preserve Auth0/JWT authentication and policy authorization. Review the protected route tree and explicit serializer fields against [API guidance](/api/README.md), not a generic replacement base class.
- Backend service actions use static `perform()`; direct construction belongs only in that implementation. Apply the [controller](/api/src/controllers/README.md), [policy](/api/src/policies/README.md), [service](/api/src/services/README.md), and [serializer](/api/src/serializers/README.md) boundaries.
- Apply [API](/api/tests/README.md) and [web](/web/tests/README.md) test overlays. In ELCC, HTTP status first and complete body second remain direct `toEqual(...)` assertions for one response contract; do not replace them with a synthetic bundle or impose an assertion quota.
- Retain singular/plural model-mirror composables while their model exists, even without current callers; see [composable conventions](/web/src/use/README.md). Review screen-owned edit/queue behavior under [component responsibilities](/web/src/components/README.md).

Run the smallest relevant documented checks through [bin/dev](/bin/README.md), respecting isolated test databases and test-container concurrency. Documentation-only work uses source/discovery and applied-consumption proof; it does not establish application runtime behavior.
