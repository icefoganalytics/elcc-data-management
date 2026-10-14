# Searchable Autocomplete Template

**Location:** `web/src/components/{resource-names}/SearchableResourceNameAutocomplete.vue`

## Template

```vue
<template>
  <v-autocomplete
    v-model="selectedValue"
    :items="items"
    :loading="isLoading"
    :search="searchQuery"
    item-title="name"
    item-value="id"
    label="Select Resource Name"
    placeholder="Start typing to search..."
    clearable
    return-object
    :no-data-text="isLoading ? 'Loading...' : 'No resource names found'"
    @update:search="handleSearch"
    @update:model-value="handleSelection"
  >
    <template #item="{ props, item }">
      <v-list-item v-bind="props" :title="item.raw.name">
        <v-list-item-subtitle>
          ${{ item.raw.amount }} - {{ item.raw.isActive ? 'Active' : 'Inactive' }}
        </v-list-item-subtitle>
      </v-list-item>
    </template>

    <template #selection="{ item }">
      <span>{{ item.raw.name }}</span>
    </template>
  </v-autocomplete>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue"
import { debounce } from "lodash"
import ResourceNamesApi, { type ResourceNameAsReference } from "@/api/resource-names-api"

interface Props {
  modelValue?: ResourceNameAsReference | null
  disabled?: boolean
  placeholder?: string
}

interface Emits {
  (e: 'update:modelValue', value: ResourceNameAsReference | null): void
  (e: 'selection', value: ResourceNameAsReference | null): void
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  placeholder: 'Start typing to search...'
})

const emit = defineEmits<Emits>()

const items = ref<ResourceNameAsReference[]>([])
const isLoading = ref(false)
const searchQuery = ref("")
const selectedValue = ref<ResourceNameAsReference | null>(props.modelValue || null)

// Debounced search function
const debouncedSearch = debounce(async (query: string): Promise<void> => {
  if (!query.trim()) {
    items.value = []
    return
  }

  try {
    isLoading.value = true
    const response = await ResourceNamesApi.reference({
      search: query,
      perPage: 50,
    })

    if (response.success) {
      items.value = response.data
    }
  } catch (error) {
    console.error('Search failed:', error)
    items.value = []
  } finally {
    isLoading.value = false
  }
}, 300)

function handleSearch(query: string): void {
  searchQuery.value = query
  debouncedSearch(query)
}

function handleSelection(value: ResourceNameAsReference | null): void {
  selectedValue.value = value
  emit('update:modelValue', value)
  emit('selection', value)
}

// Watch for external model changes
watch(() => props.modelValue, (newValue) => {
  selectedValue.value = newValue
})

// Load initial items if needed
onMounted(() => {
  if (props.modelValue) {
    selectedValue.value = props.modelValue
  }
})

// Expose methods for parent component
defineExpose({
  clear: () => {
    selectedValue.value = null
    searchQuery.value = ""
    items.value = []
  },
  focus: () => {
    // Focus logic can be added here if needed
  }
})
</script>

<style scoped>
.v-autocomplete {
  width: 100%;
}
</style>
```

## Usage Example

```vue
<template>
  <v-form>
    <SearchableResourceNameAutocomplete
      v-model="selectedResourceName"
      @selection="handleResourceNameSelection"
    />
    
    <v-btn
      :disabled="!selectedResourceName"
      @click="proceedWithSelection"
    >
      Continue
    </v-btn>
  </v-form>
</template>

<script setup lang="ts">
import { ref } from "vue"
import SearchableResourceNameAutocomplete from "@/components/resource-names/SearchableResourceNameAutocomplete.vue"
import type { ResourceNameAsReference } from "@/api/resource-names-api"

const selectedResourceName = ref<ResourceNameAsReference | null>(null)

function handleResourceNameSelection(resourceName: ResourceNameAsReference | null): void {
  console.log('Selected:', resourceName)
}

function proceedWithSelection(): void {
  if (selectedResourceName.value) {
    // Process selection
  }
}
</script>
```

## Integration

1. Import in parent components:
   ```typescript
   import SearchableResourceNameAutocomplete from "@/components/resource-names/SearchableResourceNameAutocomplete.vue"
   ```

2. Use in forms or selection interfaces

## Verification Checklist

- [ ] Debounced search to avoid excessive API calls
- [ ] Proper loading states
- [ ] Clear and no-data states
- [ ] Custom item templates with additional info
- [ ] Two-way binding with v-model
- [ ] Event emission for selection changes
- [ ] Accessibility features
- [ ] Responsive design
- [ ] Error handling for failed searches
