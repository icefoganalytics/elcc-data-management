# Services Templates

**Location:** `api/src/services/{resource-names}/`

Create 4 files in a folder named after the resource (plural, kebab-case).

---

## create-service.ts

```typescript
import { Attributes } from "@sequelize/core"
import { isNil } from "lodash"

import { ResourceName, User } from "@/models"
import BaseService from "@/services/base-service"

export type ResourceNameCreationAttributes = Partial<Attributes<ResourceName>>

export class CreateService extends BaseService {
  constructor(
    private attributes: ResourceNameCreationAttributes,
    private currentUser: User
  ) {
    super()
  }

  async perform(): Promise<ResourceName> {
    const { name, ...optionalAttributes } = this.attributes

    if (isNil(name)) {
      throw new Error("Name is required")
    }

    const resourceName = await ResourceName.create({
      ...optionalAttributes,
      name,
    })
    return resourceName
  }

  static async perform(
    attributes: ResourceNameCreationAttributes,
    currentUser: User
  ): Promise<ResourceName> {
    const service = new CreateService(attributes, currentUser)
    return service.perform()
  }
}
```

---

## update-service.ts

```typescript
import { Attributes } from "@sequelize/core"
import { isNil } from "lodash"

import { ResourceName, User } from "@/models"
import BaseService from "@/services/base-service"

export type ResourceNameUpdateAttributes = Partial<Attributes<ResourceName>>

export class UpdateService extends BaseService {
  constructor(
    private resourceName: ResourceName,
    private attributes: ResourceNameUpdateAttributes,
    private currentUser: User
  ) {
    super()
  }

  async perform(): Promise<ResourceName> {
    const { name, description, amount, isActive } = this.attributes

    if (!isNil(name)) {
      this.resourceName.name = name
    }

    if (!isNil(description)) {
      this.resourceName.description = description
    }

    if (!isNil(amount)) {
      this.resourceName.amount = amount
    }

    if (!isNil(isActive)) {
      this.resourceName.isActive = isActive
    }

    await this.resourceName.save()
    return this.resourceName
  }

  static async perform(
    resourceName: ResourceName,
    attributes: ResourceNameUpdateAttributes,
    currentUser: User
  ): Promise<ResourceName> {
    const service = new UpdateService(resourceName, attributes, currentUser)
    return service.perform()
  }
}
```

---

## destroy-service.ts

```typescript
import { ResourceName, User } from "@/models"
import BaseService from "@/services/base-service"

export class DestroyService extends BaseService {
  constructor(
    private resourceName: ResourceName,
    private currentUser: User
  ) {
    super()
  }

  async perform(): Promise<void> {
    await this.resourceName.destroy()
  }

  static async perform(
    resourceName: ResourceName,
    currentUser: User
  ): Promise<void> {
    const service = new DestroyService(resourceName, currentUser)
    return service.perform()
  }
}
```

---

## index.ts

```typescript
export { CreateService } from "./create-service"
export { DestroyService } from "./destroy-service"
export { UpdateService } from "./update-service"
export type { ResourceNameCreationAttributes } from "./create-service"
export type { ResourceNameUpdateAttributes } from "./update-service"
```

## Integration

1. Add to main services index:
   ```typescript
   export * from "./resource-names"
   ```

2. Import in controller:
   ```typescript
   import { CreateService, UpdateService, DestroyService } from "@/services/resource-names"
   ```

## Verification Checklist

- [ ] All services extend BaseService
- [ ] CreateService validates required attributes
- [ ] UpdateService only updates provided attributes
- [ ] DestroyService uses soft delete via Sequelize
- [ ] All services have static perform() methods
- [ ] Proper TypeScript types for attributes
- [ ] Error handling for validation
- [ ] Index file exports all services and types
