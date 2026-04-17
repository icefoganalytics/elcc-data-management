# API Client Template

**Location:** `web/src/api/{resource-names}-api.ts`

## Template

```typescript
import http from "@/api/http-client"
import {
  type FiltersOptions,
  type Policy,
  type QueryOptions,
  type WhereOptions,
} from "@/api/base-api"

/** Keep in sync with api/src/models/resource-name.ts */
export type ResourceName = {
  id: number
  name: string
  description: string
  amount: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/** Keep in sync with api/src/serializers/resource-names/index-serializer.ts */
export type ResourceNameAsIndex = Pick<
  ResourceName,
  "id" | "name" | "isActive" | "createdAt" | "updatedAt"
>

/** Keep in sync with api/src/serializers/resource-names/show-serializer.ts */
export type ResourceNameAsShow = Pick<
  ResourceName,
  "id" | "name" | "description" | "amount" | "isActive" | "createdAt" | "updatedAt"
>

/** Keep in sync with api/src/serializers/resource-names/reference-serializer.ts */
export type ResourceNameAsReference = Pick<ResourceName, "id" | "name">

export default class ResourceNamesApi {
  static async index(
    options: QueryOptions<ResourceName> = {}
  ): Promise<Policy<ResourceNameAsIndex[]>> {
    return http.get("/resource-names", {
      params: options,
    })
  }

  static async show(id: number): Promise<Policy<ResourceNameAsShow>> {
    return http.get(`/resource-names/${id}`)
  }

  static async create(
    data: Omit<ResourceName, "id" | "createdAt" | "updatedAt">
  ): Promise<Policy<ResourceNameAsShow>> {
    return http.post("/resource-names", data)
  }

  static async update(
    id: number,
    data: Partial<Omit<ResourceName, "id" | "createdAt" | "updatedAt">>
  ): Promise<Policy<ResourceNameAsShow>> {
    return http.patch(`/resource-names/${id}`, data)
  }

  static async destroy(id: number): Promise<void> {
    return http.delete(`/resource-names/${id}`)
  }

  static async reference(
    options: QueryOptions<ResourceName> = {}
  ): Promise<Policy<ResourceNameAsReference[]>> {
    return http.get("/resource-names", {
      params: {
        ...options,
        serializer: "reference",
      },
    })
  }
}
```

## Integration

1. Add to main API index:
   ```typescript
   export { default as ResourceNamesApi } from "./resource-names-api"
   export type { ResourceName, ResourceNameAsIndex, ResourceNameAsShow, ResourceNameAsReference } from "./resource-names-api"
   ```

2. Import in components/composables:
   ```typescript
   import ResourceNamesApi, { type ResourceName } from "@/api/resource-names-api"
   ```

## Verification Checklist

- [ ] Types match backend model and serializers
- [ ] All CRUD methods implemented
- [ ] Proper HTTP methods (GET, POST, PATCH, DELETE)
- [ ] Reference endpoint for dropdowns
- [ ] Proper TypeScript generics for QueryOptions
- [ ] Consistent parameter naming
- [ ] Error handling via http client
- [ ] Static methods for easy usage
