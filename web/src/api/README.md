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
