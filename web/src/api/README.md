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

## Response and Recovery Boundaries

JSON clients classify responses before callers consume data, including public status requests and rejected HTTP statuses. Both the shared client and legacy authenticated factory use this boundary. Explicit non-JSON `responseType` values retain their download/text contracts; no endpoint-prefix allowlist defines which JSON responses are checked.

Only `cf-mitigated: challenge` identifies a browser-verification challenge. Other HTML and malformed JSON are application failures, not successful records or permission denials. Transport throws metadata-only errors and never imports notification state. Do not retain response bodies, request credentials, query strings, or fragments in recovery diagnostics.

UI catches forward the original error with `snack.error(message, { cause: error })`, or rethrow it through Vue's application error handler. Preserve typed interruptions inside `AggregateError` when parallel mutations settle. Keep cleanup and draft ownership local. Await request-bearing watcher callbacks so Vue observes rejections; detached autosave and debounced callbacks must report through the same snackbar rather than leave an unhandled promise. Legacy error notifications forward the cause to this shared UI boundary.

Register global response recovery through the application plugin, not inline bootstrap code. Preserve any previously registered Vue error handler for unrelated failures, including its component instance and error context.

Recovery keeps loaded forms mounted and offers an explicit reload with an unsaved-changes warning. Account initialization failures expose a terminal retry state without mounting protected pages; later refresh failures do not discard an already loaded account. Never automatically replay an interrupted write: the response does not prove whether the server applied it. An unchanged blur or recovery dismissal is not a retry; pause uncertain autosaves until an explicit retry or reload. Check current server state before a manual retry. A normal-browser verification or reload does not guarantee clearance.

Use metadata-only recovery; this application does not display intermediary HTML. The design follows the shared [intermediary-response guidance](https://github.com/klondikemarlen/marlens-skills-rules-and-tools/blob/main/docs/references/engineering-techniques-reference.md#intermediary-responses-to-json-requests), informed by WRAP's recovery and async-lifecycle fixes. No socket or polling request listeners currently require a separate lifecycle adapter; Vue owns the existing mounted and watcher callbacks.
