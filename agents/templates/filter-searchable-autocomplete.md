# Filter Searchable Autocomplete Template

Route-query-synced wrapper for a searchable autocomplete. Syncs selected filter state to a URL query parameter so filter state survives page refreshes and dashboard reloads.

## File

`web/src/components/common/tables/Filter{Model}SearchableAutocomplete.vue`

## Template: Single ID Filter

```vue
<template><{Model}SearchableAutocomplete v-model="modelId" :filters="filters" /></template>

<script setup lang="ts">
import { watch } from "vue"
import { useRouteQuery } from "@vueuse/router"

import { integerTransformer } from "@/utils/use-route-query-transformers"

import {Model}SearchableAutocomplete from "@/components/{model-plural}/{Model}SearchableAutocomplete.vue"

const loaded = defineModel<boolean>("loaded", {
  default: false,
})

const props = withDefaults(
  defineProps<{
    modelValue: number | null
    filters?: Omit<{Model}FiltersOptions, "search">
    routeQueryPrefix?: string
  }>(),
  {
    routeQueryPrefix: "",
  }
)

const emit = defineEmits<{
  "update:modelValue": [value: number | null]
  "update:filters": [value: {Model}FiltersOptions]
}>()

const modelId = useRouteQuery(`${props.routeQueryPrefix}{modelName}Id`, null, integerTransformer)

watch(modelId, (newValue) => {
  emit("update:modelValue", newValue)
  emit("update:filters", {
    ...props.filters,
    {modelName}Id: newValue,
  })
  loaded.value = true
})

watch(() => props.modelValue, (newValue) => {
  modelId.value = newValue
})
</script>
```

## Template: Multi-Select Filter

```vue
<template><{Model}SearchableAutocomplete v-model="modelIds" :filters="filters" multiple /></template>

<script setup lang="ts">
import { watch } from "vue"
import { useRouteQuery } from "@vueuse/router"

import { integerArrayTransformer } from "@/utils/use-route-query-transformers"

import {Model}SearchableAutocomplete from "@/components/{model-plural}/{Model}SearchableAutocomplete.vue"

const loaded = defineModel<boolean>("loaded", {
  default: false,
})

const props = withDefaults(
  defineProps<{
    modelValue: number[]
    filters?: Omit<{Model}FiltersOptions, "search">
    routeQueryPrefix?: string
  }>(),
  {
    routeQueryPrefix: "",
  }
)

const emit = defineEmits<{
  "update:modelValue": [value: number[]]
  "update:filters": [value: {Model}FiltersOptions]
}>()

const modelIds = useRouteQuery(`${props.routeQueryPrefix}{modelName}Ids`, [], integerArrayTransformer)

watch(modelIds, (newValue) => {
  emit("update:modelValue", newValue)
  emit("update:filters", {
    ...props.filters,
    {modelName}Ids: newValue,
  })
  loaded.value = true
})

watch(() => props.modelValue, (newValue) => {
  modelIds.value = newValue
})
</script>
```

## Usage in Dashboard Filters

```vue
<template>
  <v-card>
    <v-card-title>Filters</v-card-title>
    <v-card-text>
      <FilterFundingRegionSearchableAutocomplete
        v-model="selectedFundingRegionId"
        :filters="filters"
        @update:filters="handleFiltersUpdate"
      />
      
      <FilterCentreSearchableAutocomplete
        v-model="selectedCentreIds"
        :filters="filters"
        multiple
        @update:filters="handleFiltersUpdate"
      />
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from "vue"
import FilterFundingRegionSearchableAutocomplete from "@/components/common/tables/FilterFundingRegionSearchableAutocomplete.vue"
import FilterCentreSearchableAutocomplete from "@/components/common/tables/FilterCentreSearchableAutocomplete.vue"

const selectedFundingRegionId = ref<number | null>(null)
const selectedCentreIds = ref<number[]>([])

const filters = ref<{
  fundingRegionId?: number | null
  centreIds?: number[]
}>({})

function handleFiltersUpdate(newFilters: typeof filters.value): void {
  filters.value = newFilters
}
</script>
```

## Integration Requirements

1. Create route query transformers in `web/src/utils/use-route-query-transformers.ts`:
   ```typescript
   export const integerTransformer = {
     get: (value: string | null) => value ? parseInt(value, 10) : null,
     set: (value: number | null) => value?.toString() ?? null,
   }
   
   export const integerArrayTransformer = {
     get: (value: string | null) => value ? value.split(',').map(Number) : [],
     set: (value: number[]) => value.join(','),
   }
   ```

2. Update filter types to include new filter options

3. Ensure base searchable autocomplete component exists

## Verification Checklist

- [ ] Route query synchronization works correctly
- [ ] URL parameters persist on page refresh
- [ ] Multiple selection support when needed
- [ ] Proper TypeScript types for filters
- [ ] Loading states handled correctly
- [ ] Clear/reset functionality works
- [ ] Filter updates propagate to parent components
