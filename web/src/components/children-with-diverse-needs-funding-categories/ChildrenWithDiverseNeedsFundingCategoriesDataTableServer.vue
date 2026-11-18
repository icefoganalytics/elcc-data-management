<template>
  <v-skeleton-loader
    v-if="isLoading && totalCount === 0"
    type="table"
  />
  <v-data-table-server
    v-else
    v-model:items-per-page="perPage"
    v-model:sort-by="sortBy"
    v-model:page="page"
    :headers="headers"
    :items="childrenWithDiverseNeedsFundingCategories"
    :items-length="totalCount"
    :loading="isLoading"
    density="comfortable"
    class="row-clickable"
    @dblclick:row="
      (_event: unknown, { item }: ChildrenWithDiverseNeedsFundingCategoryTableRow) =>
        goToChildrenWithDiverseNeedsFundingCategory(item.id)
    "
  >
    <template #item.fromAge="{ item }">
      {{ item.fromAge ?? "—" }}
    </template>
    <template #item.toAge="{ item }">
      {{ item.toAge ?? "—" }}
    </template>
    <template #item.monthlyAmount="{ item }">
      {{ formatMoney(item.monthlyAmount, monthlyAmountFormatOptions) }}
    </template>
    <template #item.actions="{ item }">
      <v-btn
        color="secondary"
        variant="outlined"
        :to="{
          name: 'administration/children-with-diverse-needs-funding-categories/ChildrenWithDiverseNeedsFundingCategoryPage',
          params: {
            childrenWithDiverseNeedsFundingCategoryId: item.id,
          },
        }"
        >View</v-btn
      >
    </template>
  </v-data-table-server>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useRouter } from "vue-router"

import type {
  ChildrenWithDiverseNeedsFundingCategoryAsIndex,
  ChildrenWithDiverseNeedsFundingCategoryFiltersOptions,
  ChildrenWithDiverseNeedsFundingCategoryWhereOptions,
} from "@/api/children-with-diverse-needs-funding-categories-api"

import { formatMoney } from "@/utils/formatters"

import useRouteQueriableTableOptions from "@/use/utils/use-route-queriable-table-options"
import useChildrenWithDiverseNeedsFundingCategories from "@/use/use-children-with-diverse-needs-funding-categories"

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
    title: "Monthly Amount",
    key: "monthlyAmount",
  },
  {
    title: "Actions",
    key: "actions",
    sortable: false,
  },
])

const { page, perPage, sortBy, order } = useRouteQueriableTableOptions({
  routeQuerySuffix: props.routeQuerySuffix,
  sortBy: [
    {
      key: "categoryName",
      order: "asc",
    },
  ],
})

watch(
  () => [props.where, props.filters],
  () => {
    page.value = 1
  },
  {
    deep: true,
  }
)

const childrenWithDiverseNeedsFundingCategoriesQuery = computed(() => ({
  filters: props.filters,
  where: props.where,
  order: order.value,
  page: page.value,
  perPage: perPage.value,
}))
const { childrenWithDiverseNeedsFundingCategories, totalCount, isLoading } =
  useChildrenWithDiverseNeedsFundingCategories(childrenWithDiverseNeedsFundingCategoriesQuery)

const router = useRouter()

type ChildrenWithDiverseNeedsFundingCategoryTableRow = {
  item: ChildrenWithDiverseNeedsFundingCategoryAsIndex
}

function goToChildrenWithDiverseNeedsFundingCategory(
  childrenWithDiverseNeedsFundingCategoryId: number
) {
  router.push({
    name: "administration/children-with-diverse-needs-funding-categories/ChildrenWithDiverseNeedsFundingCategoryPage",
    params: {
      childrenWithDiverseNeedsFundingCategoryId,
    },
  })
}

const monthlyAmountFormatOptions = {
  maximumFractionDigits: 4,
}
</script>
