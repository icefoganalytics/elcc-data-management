# Policy Template

**Location:** `api/src/policies/{resource-name}-policy.ts`

## Template

```typescript
import { Attributes, FindOptions } from "@sequelize/core"

import { type Path } from "@/utils/deep-pick"

import { ResourceName, User } from "@/models"
import { ALL_RECORDS_SCOPE, PolicyFactory } from "@/policies/base-policy"

export class ResourceNamePolicy extends PolicyFactory(ResourceName) {
  show(): boolean {
    return true
  }

  create(): boolean {
    if (this.user.isSystemAdmin) return true

    return false
  }

  update(): boolean {
    if (this.user.isSystemAdmin) return true

    return false
  }

  destroy(): boolean {
    if (this.user.isSystemAdmin) return true

    return false
  }

  permittedAttributes(): Path[] {
    return ["name", "description", "amount", "isActive"]
  }

  permittedAttributesForCreate(): Path[] {
    return ["name", "description", "amount", ...this.permittedAttributes()]
  }

  static policyScope(user: User): FindOptions<Attributes<ResourceName>> {
    if (user.isSystemAdmin) {
      return ALL_RECORDS_SCOPE
    }

    return {
      where: {
        isActive: true,
      },
    }
  }
}
```

## Integration

1. Add to `api/src/policies/index.ts`:
   ```typescript
   export { ResourceNamePolicy } from "./resource-name-policy"
   ```

2. Import in controller:
   ```typescript
   import { ResourceNamePolicy } from "@/policies"
   ```

## Verification Checklist

- [ ] Extends PolicyFactory(ResourceName)
- [ ] All CRUD methods return boolean
- [ ] System admin gets full access
- [ ] permittedAttributes() returns array of allowed fields
- [ ] permittedAttributesForCreate() includes required fields
- [ ] Static policyScope() method for query scoping
- [ ] Uses ALL_RECORDS_SCOPE for admin users
- [ ] Proper imports and exports
