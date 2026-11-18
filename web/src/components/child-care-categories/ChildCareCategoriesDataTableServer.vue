<template>
  <v-data-table-server
    v-model:items-per-page="perPage"
    v-model:sort-by="sortBy"
    :page="page"
    :headers="headers"
    :items="childCareCategories"
    :items-length="totalCount"
    :loading="isLoading || waiting"
    density="comfortable"
    class="row-clickable"
    @dblclick:row="
      (_event: unknown, { item }: ChildCareCategoryTableRow) => goToChildCareCategoryPage(item)
    "
    @update:page="updatePage"
  >
    <template #top="slotProps">
      <slot
        name="top"
        v-bind="slotProps"
      ></slot>
    </template>
    <template #item.fromAge="{ item }">
      {{ item.fromAge ?? "—" }}
    </template>
    <template #item.toAge="{ item }">
      {{ item.toAge ?? "—" }}
    </template>
    <template #item.actions="{ item }">
      <v-btn
        color="secondary"
        variant="outlined"
        :to="buildChildCareCategoryTo(item)"
        >View</v-btn
      >
    </template>
  </v-data-table-server>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useRouteQuery } from "@vueuse/router"
import { useRouter } from "vue-router"

import useSnack from "@/use/use-snack"
import useVuetifySortByToSafeRouteQuery from "@/use/vuetify/use-vuetify-sort-by-to-safe-route-query"
import useVuetifySortByToSequelizeSafeOrder from "@/use/vuetify/use-vuetify-sort-by-to-sequelize-safe-order"
import useChildCareCategories, {
  type ChildCareCategoryAsIndex,
  type ChildCareCategoryFiltersOptions,
  type ChildCareCategoryWhereOptions,
} from "@/use/use-child-care-categories"

const props = withDefaults(
  defineProps<{
    filters?: ChildCareCategoryFiltersOptions
    where?: ChildCareCategoryWhereOptions
    routeQuerySuffix?: string
    waiting?: boolean
  }>(),
  {
    filters: () => ({}),
    where: () => ({}),
    routeQuerySuffix: "",
    waiting: false,
  }
)

const headers = ref([
  {
    title: "Category Name",
    key: "categoryName",
    minWidth: "200px",
    cellProps: {
      class: "text-wrap",
    },
  },
  {
    title: "From Age",
    key: "fromAge",
  },
  {
    title: "To Age",
    key: "toAge",
  },
  {
    title: "Actions",
    key: "actions",
    sortable: false,
  },
])

const page = useRouteQuery(`page${props.routeQuerySuffix}`, "1", { transform: Number })
const perPage = useRouteQuery(`perPage${props.routeQuerySuffix}`, "10", { transform: Number })
const sortBy = useVuetifySortByToSafeRouteQuery(`sortBy${props.routeQuerySuffix}`, [
  {
    key: "categoryName",
    order: "asc",
  },
])

const order = useVuetifySortByToSequelizeSafeOrder(sortBy)

watch(
  () => [props.where, props.filters],
  () => {
    page.value = 1
  },
  {
    deep: true,
  }
)

const childCareCategoriesQuery = computed(() => {
  return {
    filters: props.filters,
    where: props.where,
    order: order.value,
    page: page.value,
    perPage: perPage.value,
  }
})
const { childCareCategories, totalCount, isLoading, isErrored } = useChildCareCategories(
  childCareCategoriesQuery,
  {
    skipWatchIf: () => props.waiting,
  }
)

const snack = useSnack()
watch(isErrored, (isErrored) => {
  if (isErrored) snack.error("Child Care categories could not be loaded.")
})

// Necessary to avoid wiping page value due to bug in Vuetify table implementation
// which causes page value to be wiped if changed during loading state.
function updatePage(newPage: number) {
  if (isLoading.value) return

  page.value = newPage
}

const router = useRouter()

type ChildCareCategoryTableRow = {
  item: ChildCareCategoryAsIndex
}

function buildChildCareCategoryTo(item: ChildCareCategoryAsIndex) {
  return {
    name: "administration/child-care-categories/ChildCareCategoryPage",
    params: {
      childCareCategoryId: item.id,
    },
  }
}

function goToChildCareCategoryPage(item: ChildCareCategoryAsIndex) {
  const route = buildChildCareCategoryTo(item)

  return router.push(route)
}
</script>
