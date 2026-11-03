<template>
  <v-empty-state
    v-if="isErrored"
    class="ma-5"
    icon="mdi-alert-circle-outline"
    headline="Unable to Load Categories"
    title="Diverse need categories could not be loaded."
    text="Try changing a filter or reloading the page."
  >
    <template #actions>
      <v-btn
        color="primary"
        @click="reload"
        >Retry</v-btn
      >
    </template>
  </v-empty-state>
  <v-data-table-server
    v-else
    v-model:items-per-page="perPage"
    v-model:sort-by="sortBy"
    :page="page"
    :headers="headers"
    :items="childrenWithChildrenWithDiverseNeedsFundingRecordsCategories"
    :items-length="totalCount"
    :loading="isLoading"
    density="comfortable"
    class="row-clickable"
    @dblclick:row="
      (_event: unknown, { item }: ChildrenWithDiverseNeedsFundingCategoryTableRow) =>
        goToChildrenWithDiverseNeedsFundingCategory(item)
    "
    @update:page="updatePage"
  >
    <template #item.fromAge="{ item }">{{ item.fromAge ?? "—" }}</template>
    <template #item.toAge="{ item }">{{ item.toAge ?? "—" }}</template>
    <template #item.monthlyAmount="{ item }">
      {{ formatMoney(item.monthlyAmount, monthlyAmountFormatOptions) }}
    </template>
    <template #item.actions="{ item }">
      <v-btn
        color="secondary"
        variant="outlined"
        :to="buildChildrenWithDiverseNeedsFundingCategoryTo(item)"
        >View</v-btn
      >
    </template>
  </v-data-table-server>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useRouteQuery } from "@vueuse/router"
import { useRouter } from "vue-router"

import { formatMoney } from "@/utils/formatters"
import useVuetifySortByToSafeRouteQuery from "@/use/vuetify/use-vuetify-sort-by-to-safe-route-query"
import useVuetifySortByToSequelizeSafeOrder from "@/use/vuetify/use-vuetify-sort-by-to-sequelize-safe-order"
import useChildrenWithDiverseNeedsFundingCategories from "@/use/use-children-with-diverse-needs-funding-categories"
import type {
  ChildrenWithDiverseNeedsFundingCategoryAsIndex,
  ChildrenWithDiverseNeedsFundingCategoryFiltersOptions,
  ChildrenWithDiverseNeedsFundingCategoryWhereOptions,
} from "@/api/children-with-diverse-needs-funding-categories-api"

const props = withDefaults(
  defineProps<{
    filters?: ChildrenWithDiverseNeedsFundingCategoryFiltersOptions
    where?: ChildrenWithDiverseNeedsFundingCategoryWhereOptions
    routeQuerySuffix?: string
  }>(),
  {
    filters: () => ({}),
    where: () => ({}),
    routeQuerySuffix: "",
  }
)

const monthlyAmountFormatOptions = {
  maximumFractionDigits: 4,
}
const headers = ref([
  {
    title: "Category Name",
    key: "categoryName",
    minWidth: "200px",
    cellProps: {
      class: "text-wrap",
    },
  },
  { title: "From Age", key: "fromAge" },
  { title: "To Age", key: "toAge" },
  { title: "Monthly Amount", key: "monthlyAmount" },
  { title: "Actions", key: "actions", sortable: false },
])
const page = useRouteQuery(`page${props.routeQuerySuffix}`, "1", { transform: Number })
const perPage = useRouteQuery(`perPage${props.routeQuerySuffix}`, "10", { transform: Number })
const sortBy = useVuetifySortByToSafeRouteQuery(`sortBy${props.routeQuerySuffix}`, [
  { key: "categoryName", order: "asc" },
])
const order = useVuetifySortByToSequelizeSafeOrder(sortBy)

watch(
  () => [props.where, props.filters],
  () => {
    page.value = 1
  },
  { deep: true }
)

const query = computed(() => ({
  filters: props.filters,
  where: props.where,
  order: order.value,
  page: page.value,
  perPage: perPage.value,
}))
const { childrenWithChildrenWithDiverseNeedsFundingRecordsCategories, totalCount, isLoading, isErrored, fetch } =
  useChildrenWithDiverseNeedsFundingCategories(query)

async function reload() {
  try {
    await fetch()
  } catch {
    // The table state presents the retryable load failure.
  }
}

function updatePage(newPage: number) {
  if (isLoading.value) return

  page.value = newPage
}

const router = useRouter()
type ChildrenWithDiverseNeedsFundingCategoryTableRow = { item: ChildrenWithDiverseNeedsFundingCategoryAsIndex }

function buildChildrenWithDiverseNeedsFundingCategoryTo(item: ChildrenWithDiverseNeedsFundingCategoryAsIndex) {
  return {
    name: "administration/children-with-diverse-needs-funding-categories/ChildrenWithDiverseNeedsFundingCategoryPage",
    params: { childrenWithChildrenWithDiverseNeedsFundingRecordsCategoryId: item.id },
  }
}

function goToChildrenWithDiverseNeedsFundingCategory(item: ChildrenWithDiverseNeedsFundingCategoryAsIndex) {
  router.push(buildChildrenWithDiverseNeedsFundingCategoryTo(item))
}
</script>
