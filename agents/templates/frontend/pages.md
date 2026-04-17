# Pages Templates

**Location:** `web/src/pages/{resource-names}/`

Create a folder named after the resource (plural, kebab-case).

---

## IndexPage.vue

List page with data table and search functionality.

```vue
<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center pa-4">
            <span class="text-h5">Resource Names</span>
            <v-spacer />
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              @click="goToCreatePage"
            >
              Add Resource Name
            </v-btn>
          </v-card-title>

          <v-card-text>
            <v-text-field
              v-model="searchQuery"
              label="Search resource names..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              clearable
              @update:model-value="handleSearch"
            />

            <ResourceNamesDataTable />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, watch } from "vue"
import { useRouter } from "vue-router"
import { useResourceNames } from "@/composables/use-resource-names"
import ResourceNamesDataTable from "@/components/resource-names/ResourceNamesDataTable.vue"

const router = useRouter()

const {
  searchQuery,
  fetchResourceNames,
  watchDependencies,
} = useResourceNames()

onMounted(() => {
  fetchResourceNames()
})

watch(watchDependencies, () => {
  fetchResourceNames()
}, { deep: true })

function goToCreatePage(): void {
  router.push("/resource-names/new")
}

function handleSearch(): void {
  // Reset to first page when searching
  fetchResourceNames()
}
</script>
```

---

## ShowPage.vue

Detail view page for a single resource name.

```vue
<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center pa-4">
            <span class="text-h5">Resource Name Details</span>
            <v-spacer />
            <v-btn
              color="primary"
              prepend-icon="mdi-pencil"
              @click="goToEditPage"
            >
              Edit
            </v-btn>
          </v-card-title>

          <v-card-text v-if="isLoading">
            <v-skeleton-loader type="article" />
          </v-card-text>

          <v-card-text v-else-if="error">
            <v-alert type="error" :text="error" />
          </v-card-text>

          <v-card-text v-else-if="resourceName">
            <v-row>
              <v-col cols="12" md="6">
                <v-list>
                  <v-list-item>
                    <v-list-item-title>Name</v-list-item-title>
                    <v-list-item-subtitle>{{ resourceName.name }}</v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item>
                    <v-list-item-title>Description</v-list-item-title>
                    <v-list-item-subtitle>{{ resourceName.description }}</v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item>
                    <v-list-item-title>Amount</v-list-item-title>
                    <v-list-item-subtitle>${{ resourceName.amount }}</v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item>
                    <v-list-item-title>Status</v-list-item-title>
                    <v-list-item-subtitle>
                      <v-chip :color="resourceName.isActive ? 'success' : 'error'" size="small">
                        {{ resourceName.isActive ? 'Active' : 'Inactive' }}
                      </v-chip>
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-col>

              <v-col cols="12" md="6">
                <v-list>
                  <v-list-item>
                    <v-list-item-title>Created</v-list-item-title>
                    <v-list-item-subtitle>{{ formatDate(resourceName.createdAt) }}</v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item>
                    <v-list-item-title>Updated</v-list-item-title>
                    <v-list-item-subtitle>{{ formatDate(resourceName.updatedAt) }}</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted } from "vue"
import { useRouter } from "vue-router"
import { useResourceName } from "@/composables/use-resource-names"
import { formatDate } from "@/utils/date-utils"

const router = useRouter()

const {
  resourceName,
  isLoading,
  error,
  fetchResourceName,
} = useResourceName()

onMounted(() => {
  fetchResourceName()
})

function goToEditPage(): void {
  if (resourceName.value) {
    router.push(`/resource-names/${resourceName.value.id}/edit`)
  }
}
</script>
```

---

## FormPage.vue

Create/edit form page.

```vue
<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" md="8" offset-md="2">
        <v-card>
          <v-card-title class="d-flex align-center pa-4">
            <span class="text-h5">{{ isEditing ? 'Edit' : 'Create' }} Resource Name</span>
            <v-spacer />
            <v-btn
              variant="text"
              prepend-icon="mdi-arrow-left"
              @click="goToListPage"
            >
              Back to List
            </v-btn>
          </v-card-title>

          <v-card-text>
            <v-alert
              v-if="error"
              type="error"
              :text="error"
              class="mb-4"
            />

            <ResourceNameForm @submit="handleSubmit" />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useResourceName } from "@/composables/use-resource-names"
import ResourceNameForm from "@/components/resource-names/ResourceNameForm.vue"
import type { ResourceNameAsShow } from "@/api/resource-names-api"

const route = useRoute()
const router = useRouter()

const {
  resourceName,
  isLoading,
  error,
  fetchResourceName,
} = useResourceName()

const isEditing = computed(() => route.name === 'resource-names-edit')

onMounted(() => {
  if (isEditing.value) {
    fetchResourceName()
  }
})

function handleSubmit(): void {
  router.push('/resource-names')
}

function goToListPage(): void {
  router.push('/resource-names')
}
</script>
```

## Integration

1. Add routes in router configuration:
   ```typescript
   {
     path: '/resource-names',
     name: 'resource-names',
     component: () => import('@/pages/resource-names/IndexPage.vue')
   },
   {
     path: '/resource-names/new',
     name: 'resource-names-new',
     component: () => import('@/pages/resource-names/FormPage.vue')
   },
   {
     path: '/resource-names/:id',
     name: 'resource-names-show',
     component: () => import('@/pages/resource-names/ShowPage.vue')
   },
   {
     path: '/resource-names/:id/edit',
     name: 'resource-names-edit',
     component: () => import('@/pages/resource-names/FormPage.vue')
   }
   ```

## Verification Checklist

- [ ] All CRUD pages implemented
- [ ] Proper navigation between pages
- [ ] Loading states and error handling
- [ ] Responsive design with Vuetify
- [ ] Form validation and submission
- [ ] Proper route parameters
- [ ] Component composition
