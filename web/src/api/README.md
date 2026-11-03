# API

> Explanation of Naming: _the_ API mapping to the back-end, if there was an api that corresponded to something else, such as auth0, then it would go in a folder named `web/src/auth0-api/`

APIs provide a way to map back-end endpoints to standard create/read/update/delete (CRUD) actions in the front-end. They handle api setup and data transformation. This lets them remain very simple and flexible if data needs to be transformed to match a new format from the backend, before the front-end gets updated to handle the new format.

e.g.

```javascript
// api/forms-api.js
import http from "@/api/http-client"

export const formsApi = {
  create(attributes) {
    return http.post("/api/forms", attributes).then(({ data }) => data)
  },
}

export default formsApi
```

The above code handles all access to the /api/forms endpoint, and since we are using axios it strips out the extra "data" attribute that axious wraps around the request.

This gives a single location to update if the backend naming convention changes.

## Nested Actions

Administration estimate replication uses a nested action client in `administration-costs/replicate-estimates-api.ts`. It exposes the POST through `create(administrationCostId)`, is exported by the resource's `index.ts`, and is bundled in `api/index.ts` as `api.administrationCosts.replicateEstimatesApi.create(administrationCostId)`. This keeps the separately owned replication action distinct from the parent client's list, get, and update operations. The client owns the endpoint call; worksheet save order and replication coordination remain with the caller.

Nested action clients are not the only existing POST-client shape: Child Care Spaces and Funding Submission Line JSONs expose estimate replication on their parent API clients. Preserve each resource's established contract unless migrating that resource and its callers is part of the requested work.

## Error Contracts

Use a common `ApiError` base to distinguish errors deliberately created by the API layer from preserved transport failures or unknown exceptions. Keep the base and its concrete error types together in `errors/`. The base identifies provenance; a concrete subtype identifies the recovery policy. Catching the base alone does not mean an error can be handled locally.

Keep response recognition on the concrete error type through a static predicate named for the condition it checks, such as `isUnexpectedHtmlResponse(response)`. Prefer explicit per-type names so call sites state what is being recognized rather than requiring a uniform method name across classes. Share protocol inspection through protected static helpers on the base. This lets the HTTP client select and throw an error without owning every type's recognition rules or constructing errors merely to classify a response. Inspect the response without retaining it on the error.

Classify responses at the HTTP boundary, where status, headers, and expected format are available, and throw the appropriate typed error. Preserve cancellation, transport failures, and unknown exceptions rather than converting them into ordinary API errors. Keep recovery presentation and application state outside this layer. Both the shared client and legacy authenticated factory use the same concrete response predicates; Axios owns JSON parsing. Keep useful operation-specific diagnostics when recording load or save failures, even when rethrowing. Log the error's name/message as text rather than the raw object: challenge errors contain untrusted preview content, and transport errors can carry request credentials or response bodies. See [application recovery](../components/README.md#api-response-recovery) for UI policy.

Parallel operations still wait for all started work to settle. Before handling their aggregate locally, use `rethrowUnexpectedError` to propagate the original unexpected member unchanged. Only aggregates consisting entirely of expected operation errors remain local; wrapping a challenge or authentication error must not hide it from application recovery.
