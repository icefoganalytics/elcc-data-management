# Composables Templates

**Location:** `web/src/composables/`

---

## use-resource-names.ts

Composable for managing resource name data and state.

```typescript
import { ref, computed } from "vue"
import { useRoute, useRouter } from "vue-router"
import ResourceNamesApi, { type ResourceNameAsIndex, type ResourceNameAsShow } from "@/api/resource-names-api"

export function useResourceNames() {
  const resourceNames = ref<ResourceNameAsIndex[]>([])
  const totalCount = ref(0)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Pagination
  const page = ref(1)
  const perPage = ref(25)
  const sortBy = ref([{ key: "name", order: "asc" as const }])

  // Search
  const searchQuery = ref("")

  const fetchResourceNames = async (): Promise<void> => {
    try {
      isLoading.value = true
      error.value = null

      const response = await ResourceNamesApi.index({
        page: page.value,
        perPage: perPage.value,
        sortBy: sortBy.value,
        search: searchQuery.value,
      })

      if (response.success) {
        resourceNames.value = response.data
        totalCount.value = response.meta.totalCount
      } else {
        error.value = response.error || "Failed to fetch resource names"
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : "An error occurred"
    } finally {
      isLoading.value = false
    }
  }

  const deleteResourceName = async (id: number): Promise<void> => {
    try {
      await ResourceNamesApi.destroy(id)
      await fetchResourceNames() // Refresh list
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to delete resource name"
    }
  }

  // Watch for changes and refetch
  const watchDependencies = computed(() => ({
    page: page.value,
    perPage: perPage.value,
    sortBy: sortBy.value,
    searchQuery: searchQuery.value,
  }))

  return {
    resourceNames,
    totalCount,
    isLoading,
    error,
    page,
    perPage,
    sortBy,
    searchQuery,
    fetchResourceNames,
    deleteResourceName,
    watchDependencies,
  }
}

export function useResourceName(id?: number) {
  const resourceName = ref<ResourceNameAsShow | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const route = useRoute()
  const router = useRouter()

  const resourceId = computed(() => id || Number(route.params.id))

  const fetchResourceName = async (): Promise<void> => {
    if (!resourceId.value) return

    try {
      isLoading.value = true
      error.value = null

      const response = await ResourceNamesApi.show(resourceId.value)

      if (response.success) {
        resourceName.value = response.data
      } else {
        error.value = response.error || "Failed to fetch resource name"
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : "An error occurred"
    } finally {
      isLoading.value = false
    }
  }

  return {
    resourceName,
    isLoading,
    error,
    resourceId,
    fetchResourceName,
  }
}

export function useResourceNameForm(existingResourceName?: ResourceNameAsShow) {
  const isSubmitting = ref(false)
  const error = ref<string | null>(null)

  const formData = ref({
    name: existingResourceName?.name || "",
    description: existingResourceName?.description || "",
    amount: existingResourceName?.amount || "",
    isActive: existingResourceName?.isActive ?? true,
  })

  const rules = {
    nameRules: [
      (v: string) => !!v || "Name is required",
      (v: string) => (v && v.length >= 2) || "Name must be at least 2 characters",
    ],
    descriptionRules: [
      (v: string) => !!v || "Description is required",
    ],
    amountRules: [
      (v: string) => !!v || "Amount is required",
      (v: string) => /^\d+(\.\d{2})?$/.test(v) || "Amount must be a valid monetary value",
    ],
  }

  const submit = async (): Promise<void> => {
    try {
      isSubmitting.value = true
      error.value = null

      if (existingResourceName) {
        await ResourceNamesApi.update(existingResourceName.id, formData.value)
      } else {
        await ResourceNamesApi.create(formData.value as Omit<ResourceNameAsShow, "id" | "createdAt" | "updatedAt">)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to save resource name"
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    formData,
    isSubmitting,
    error,
    rules,
    submit,
  }
}
```

## Integration

1. Add to composables index:
   ```typescript
   export { useResourceNames, useResourceName, useResourceNameForm } from "./use-resource-names"
   ```

2. Import in components/pages:
   ```typescript
   import { useResourceNames } from "@/composables/use-resource-names"
   ```

## Verification Checklist

- [ ] Proper Vue 3 Composition API usage
- [ ] TypeScript types for all data
- [ ] Error handling for all API calls
- [ ] Loading states for async operations
- [ ] Reactive state management
- [ ] Pagination and search functionality
- [ ] Form validation rules
- [ ] Proper exports and imports
