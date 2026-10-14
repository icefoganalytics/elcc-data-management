# Controller Template

**Location:** `api/src/controllers/{resource-names}-controller.ts`

## Template

```typescript
import { isNil } from "lodash"

import logger from "@/utils/logger"

import { ResourceName } from "@/models"
import { ResourceNamePolicy } from "@/policies/resource-name-policy"
import { CreateService, DestroyService, UpdateService } from "@/services/resource-names"
import { IndexSerializer, ShowSerializer } from "@/serializers/resource-names"
import BaseController from "@/controllers/base-controller"

export class ResourceNamesController extends BaseController<ResourceName> {
  async index() {
    try {
      const where = this.buildWhere()
      const filterScopes = this.buildFilterScopes()
      const order = this.buildOrder([["name", "ASC"]])
      const scopedResourceNames = ResourceNamePolicy.applyScope(
        filterScopes,
        this.currentUser
      )

      const totalRecordCount = await scopedResourceNames.count({ where })
      const resourceNameRecords = await scopedResourceNames.findAll({
        where,
        order,
        limit: this.pagination.limit,
        offset: this.pagination.offset,
      })

      const serializedResourceNames = await IndexSerializer.perform(resourceNameRecords)

      return this.response.json({
        resourceNames: serializedResourceNames,
        totalCount: totalRecordCount,
      })
    } catch (error) {
      logger.error("ResourceNamesController#index error:", error)
      return this.response.status(500).json({
        message: "Failed to fetch resource names",
      })
    }
  }

  async show() {
    try {
      const resourceName = await this.loadResourceName()
      if (isNil(resourceName)) {
        return this.response.status(404).json({ message: "Resource not found" })
      }

      const policy = this.buildPolicy(resourceName)
      if (!policy.show()) {
        return this.response.status(403).json({ message: "Access denied" })
      }

      const serializedResourceName = await ShowSerializer.perform(resourceName)

      return this.response.json({ resourceName: serializedResourceName })
    } catch (error) {
      logger.error("ResourceNamesController#show error:", error)
      return this.response.status(500).json({
        message: "Failed to fetch resource name",
      })
    }
  }

  async create() {
    try {
      const policy = ResourceNamePolicy.new(this.currentUser)
      if (!policy.create()) {
        return this.response.status(403).json({ message: "Access denied" })
      }

      const permittedAttributes = policy.permitAttributesForCreate(this.request.body)
      const resourceName = await CreateService.perform(permittedAttributes, this.currentUser)

      const serializedResourceName = await ShowSerializer.perform(resourceName)

      return this.response.status(201).json({ resourceName: serializedResourceName })
    } catch (error) {
      logger.error("ResourceNamesController#create error:", error)
      return this.response.status(422).json({
        message: "Failed to create resource name",
      })
    }
  }

  async update() {
    try {
      const resourceName = await this.loadResourceName()
      if (isNil(resourceName)) {
        return this.response.status(404).json({ message: "Resource not found" })
      }

      const policy = this.buildPolicy(resourceName)
      if (!policy.update()) {
        return this.response.status(403).json({ message: "Access denied" })
      }

      const permittedAttributes = policy.permitAttributesForUpdate(this.request.body)
      const updatedResourceName = await UpdateService.perform(
        resourceName,
        permittedAttributes,
        this.currentUser
      )

      const serializedResourceName = await ShowSerializer.perform(updatedResourceName)

      return this.response.json({ resourceName: serializedResourceName })
    } catch (error) {
      logger.error("ResourceNamesController#update error:", error)
      return this.response.status(422).json({
        message: "Failed to update resource name",
      })
    }
  }

  async destroy() {
    try {
      const resourceName = await this.loadResourceName()
      if (isNil(resourceName)) {
        return this.response.status(404).json({ message: "Resource not found" })
      }

      const policy = this.buildPolicy(resourceName)
      if (!policy.destroy()) {
        return this.response.status(403).json({ message: "Access denied" })
      }

      await DestroyService.perform(resourceName, this.currentUser)

      return this.response.status(204).send()
    } catch (error) {
      logger.error("ResourceNamesController#destroy error:", error)
      return this.response.status(422).json({
        message: "Failed to delete resource name",
      })
    }
  }

  private async loadResourceName(): Promise<ResourceName | null> {
    return ResourceName.findByPk(this.params.resourceNameId)
  }

  private buildPolicy(resourceName: ResourceName): ResourceNamePolicy {
    return new ResourceNamePolicy(this.currentUser, resourceName)
  }
}
```

## Integration

1. Add to `api/src/controllers/index.ts`:
   ```typescript
   export { ResourceNamesController } from "./resource-names-controller"
   ```

2. Add routes in `api/src/routes/index.ts`:
   ```typescript
   import { ResourceNamesController } from "@/controllers"

   router.get("/resource-names", ResourceNamesController.index)
   router.get("/resource-names/:resourceNameId", ResourceNamesController.show)
   router.post("/resource-names", ResourceNamesController.create)
   router.patch("/resource-names/:resourceNameId", ResourceNamesController.update)
   router.delete("/resource-names/:resourceNameId", ResourceNamesController.destroy)
   ```

## Verification Checklist

- [ ] Controller extends BaseController<ResourceName>
- [ ] All methods have try/catch with proper error logging
- [ ] Policy checks for show/create/update/destroy
- [ ] Proper HTTP status codes (404, 403, 422, 500)
- [ ] Serialization for index/show responses
- [ ] Pagination and ordering in index method
- [ ] Policy scoping applied in index method
