# Component Templates

**Location:** `web/src/components/{resource-names}/`

Create a folder named after the resource (plural, kebab-case).

---

## ResourceNamesDataTable.vue

Server-side paginated data table with search, sort, and actions.

```vue
<template>
  <v-data-table-server
    v-model:items-per-page="perPage"
    v-model:page="page"
    v-model:sort-by="sortBy"
    :headers="headers"
    :items="resourceNames"
    :items-length="totalCount"
    :loading="isLoading"
    @click:row="(_event: unknown, { item }: ResourceNameTableRow) => goToEditPage(item.id)"
  >
    <template #item.createdAt="{ item }">
      {{ formatDate(item.createdAt) }}
    </template>

    <template #item.updatedAt="{ item }">
      {{ formatDate(item.updatedAt) }}
    </template>

    <template #item.isActive="{ item }">
      <v-chip :color="item.isActive ? 'success' : 'error'" size="small">
        {{ item.isActive ? 'Active' : 'Inactive' }}
      </v-chip>
    </template>

    <template #item.actions="{ item }">
      <v-btn
        icon="mdi-pencil"
        size="small"
        variant="text"
        @click.stop="goToEditPage(item.id)"
      />
      <v-btn
        icon="mdi-delete"
        size="small"
        variant="text"
        color="error"
        @click.stop="deleteResourceName(item)"
      />
    </template>
  </v-data-table-server>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import { useRouter } from "vue-router"
import { useResourceNames } from "@/composables/use-resource-names"
import { formatDate } from "@/utils/date-utils"
import type { ResourceNameAsIndex } from "@/api/resource-names-api"

const router = useRouter()

const {
  resourceNames,
  totalCount,
  isLoading,
  page,
  perPage,
  sortBy,
  deleteResourceName,
} = useResourceNames()

const headers = [
  { title: "Name", key: "name", sortable: true },
  { title: "Status", key: "isActive", sortable: true },
  { title: "Created", key: "createdAt", sortable: true },
  { title: "Updated", key: "updatedAt", sortable: true },
  { title: "Actions", key: "actions", sortable: false, width: 100 },
]

type ResourceNameTableRow = {
  item: ResourceNameAsIndex
  raw: ResourceNameAsIndex
  columns: ResourceNameAsIndex[]
}

function goToEditPage(id: number): void {
  router.push(`/resource-names/${id}/edit`)
}
</script>
```

---

## ResourceNameForm.vue

Form for creating and editing resource names.

```vue
<template>
  <v-form ref="form" @submit.prevent="submit">
    <v-text-field
      v-model="formData.name"
      label="Name"
      :rules="nameRules"
      required
      variant="outlined"
    />

    <v-textarea
      v-model="formData.description"
      label="Description"
      :rules="descriptionRules"
      required
      variant="outlined"
      rows="3"
    />

    <v-text-field
      v-model="formData.amount"
      label="Amount"
      :rules="amountRules"
      required
      variant="outlined"
      prefix="$"
    />

    <v-checkbox
      v-model="formData.isActive"
      label="Active"
      color="primary"
    />

    <v-btn
      type="submit"
      color="primary"
      :loading="isSubmitting"
      block
    >
      {{ isEditing ? 'Update' : 'Create' }} Resource Name
    </v-btn>
  </v-form>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue"
import { useResourceNameForm } from "@/composables/use-resource-name-form"
import type { ResourceNameAsShow } from "@/api/resource-names-api"

interface Props {
  resourceName?: ResourceNameAsShow
}

const props = withDefaults(defineProps<Props>(), {})

const emit = defineEmits<{
  submit: [data: Partial<ResourceNameAsShow>]
}>()

const { formData, isSubmitting, submit, rules } = useResourceNameForm(props.resourceName)

const isEditing = computed(() => !!props.resourceName)

const { nameRules, descriptionRules, amountRules } = rules

const form = ref()

async function handleSubmit(): Promise<void> {
  const isValid = await form.value?.validate()
  if (!isValid) return

  await submit()
  emit('submit', formData)
}
</script>
```

## Integration

1. Create components directory structure
2. Import in pages:
   ```typescript
   import ResourceNamesDataTable from "@/components/resource-names/ResourceNamesDataTable.vue"
   import ResourceNameForm from "@/components/resource-names/ResourceNameForm.vue"
   ```

## Verification Checklist

- [ ] DataTable uses server-side pagination
- [ ] Proper TypeScript types for props
- [ ] Form validation rules implemented
- [ ] Actions for edit/delete
- [ ] Proper composables usage
- [ ] Responsive design with Vuetify
- [ ] Error handling and loading states
