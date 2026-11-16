<template>
  <v-data-table-server
    v-model:items-per-page="perPage"
    v-model:sort-by="sortBy"
    :page="page"
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
    @update:page="updatePage"
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
import { useRouteQuery } from "@vueuse/router"
import { useRouter } from "vue-router"

import type {
  ChildrenWithDiverseNeedsFundingCategoryAsIndex,
  ChildrenWithDiverseNeedsFundingCategoryFiltersOptions,
  ChildrenWithDiverseNeedsFundingCategoryWhereOptions,
} from "@/api/children-with-diverse-needs-funding-categories-api"

import { formatMoney } from "@/utils/formatters"
import { integerTransformer } from "@/utils/use-route-query-transformers"

import useVuetifySortByToSafeRouteQuery from "@/use/vuetify/use-vuetify-sort-by-to-safe-route-query"
import useVuetifySortByToSequelizeSafeOrder from "@/use/vuetify/use-vuetify-sort-by-to-sequelize-safe-order"
import useChildrenWithDiverseNeedsFundingCategories from "@/use/use-children-with-diverse-needs-funding-categories"
import useSnack from "@/use/use-snack"

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

const page = useRouteQuery<string | undefined, number | undefined>(
  `page${props.routeQuerySuffix}`,
  "1",
  {
    transform: integerTransformer,
  }
)

const perPage = useRouteQuery<string | undefined, number | undefined>(
  `perPage${props.routeQuerySuffix}`,
  "10",
  {
    transform: integerTransformer,
  }
)

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

const childrenWithDiverseNeedsFundingCategoriesQuery = computed(() => ({
  filters: props.filters,
  where: props.where,
  order: order.value,
  page: page.value,
  perPage: perPage.value,
}))
const { childrenWithDiverseNeedsFundingCategories, totalCount, isLoading, isErrored } =
  useChildrenWithDiverseNeedsFundingCategories(childrenWithDiverseNeedsFundingCategoriesQuery)

const snack = useSnack()

watch(isErrored, (isErrored) => {
  if (isErrored) snack.error("Failed to load Children with Diverse Needs categories.")
})

// Ignore Vuetify's page clamp while the result count is being loaded.
function updatePage(newPage: number) {
  if (isLoading.value) return

  page.value = newPage
}

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
