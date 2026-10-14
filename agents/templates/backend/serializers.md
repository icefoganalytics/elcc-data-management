# Serializers Templates

**Location:** `api/src/serializers/{resource-names}/`

Create 4 files in a folder named after the resource (plural, kebab-case).

---

## index-serializer.ts

Used for list/index endpoints. Returns minimal fields needed for table display.

```typescript
import { pick } from "lodash"

import { ResourceName } from "@/models"
import BaseSerializer from "@/serializers/base-serializer"

export type ResourceNameIndexView = Pick<
  ResourceName,
  "id" | "name" | "isActive" | "createdAt" | "updatedAt"
>

export class IndexSerializer extends BaseSerializer<ResourceName> {
  perform(): ResourceNameIndexView {
    return {
      ...pick(this.record, ["id", "name", "isActive", "createdAt", "updatedAt"]),
    }
  }
}

export default IndexSerializer
```

---

## show-serializer.ts

Used for show/detail endpoints. Returns all fields needed for display and editing.

```typescript
import { pick } from "lodash"

import { ResourceName } from "@/models"
import BaseSerializer from "@/serializers/base-serializer"

export type ResourceNameShowView = Pick<
  ResourceName,
  "id" | "name" | "description" | "amount" | "isActive" | "createdAt" | "updatedAt"
>

export class ShowSerializer extends BaseSerializer<ResourceName> {
  perform(): ResourceNameShowView {
    return {
      ...pick(this.record, [
        "id",
        "name",
        "description",
        "amount",
        "isActive",
        "createdAt",
        "updatedAt",
      ]),
    }
  }
}

export default ShowSerializer
```

---

## reference-serializer.ts

Used for dropdown/select options. Returns minimal fields for selection.

```typescript
import { pick } from "lodash"

import { ResourceName } from "@/models"
import BaseSerializer from "@/serializers/base-serializer"

export type ResourceNameReferenceView = Pick<ResourceName, "id" | "name">

export class ReferenceSerializer extends BaseSerializer<ResourceName> {
  perform(): ResourceNameReferenceView {
    return {
      ...pick(this.record, ["id", "name"]),
    }
  }
}

export default ReferenceSerializer
```

---

## index.ts

```typescript
export { IndexSerializer } from "./index-serializer"
export { ShowSerializer } from "./show-serializer"
export { ReferenceSerializer } from "./reference-serializer"
export type { ResourceNameIndexView } from "./index-serializer"
export type { ResourceNameShowView } from "./show-serializer"
export type { ResourceNameReferenceView } from "./reference-serializer"
```

## Integration

1. Add to main serializers index:
   ```typescript
   export * from "./resource-names"
   ```

2. Import in controller:
   ```typescript
   import { IndexSerializer, ShowSerializer } from "@/serializers/resource-names"
   ```

## Verification Checklist

- [ ] All serializers extend BaseSerializer<ResourceName>
- [ ] IndexSerializer returns minimal table fields
- [ ] ShowSerializer returns all display/edit fields
- [ ] ReferenceSerializer returns id/name for dropdowns
- [ ] Proper TypeScript types for each view
- [ ] Index file exports all serializers and types
- [ ] Uses pick() from lodash for field selection
- [ ] Default exports for convenience
