<template>
  <v-alert
    v-if="isErrored"
    type="error"
    variant="tonal"
    class="mb-4"
  >
    Child Care Space categories could not be loaded. Try again by changing a filter or reloading the
    page.
  </v-alert>
  <v-data-table-server
    v-else
    v-model:items-per-page="perPage"
    v-model:sort-by="sortBy"
    v-model:page="page"
    :headers="headers"
    :items="childCareSpaceCategories"
    :items-length="totalCount"
    :loading="isLoading || waiting"
    class="row-clickable"
    density="comfortable"
    multi-sort
    @dblclick:row="
      (_event: unknown, { item }: ChildCareSpaceCategoryTableRow) =>
        goToChildCareSpaceCategoryPage(item.id)
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
        color="yg-moss"
        variant="outlined"
        :to="{
          name: 'administration/child-care-space-categories/ChildCareSpaceCategoryPage',
          params: {
            childCareSpaceCategoryId: item.id,
          },
        }"
      >
        View
      </v-btn>
    </template>
    <template #top="slotProps">
      <slot
        name="top"
        v-bind="slotProps"
      ></slot>
    </template>
  </v-data-table-server>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useRouteQuery } from "@vueuse/router"
import { useRouter } from "vue-router"

import { integerTransformer } from "@/utils/use-route-query-transformers"
import { formatMoney } from "@/utils/formatters"

import useVuetifySortByToSafeRouteQuery from "@/use/vuetify/use-vuetify-sort-by-to-safe-route-query"
import useVuetifySortByToSequelizeSafeOrder from "@/use/vuetify/use-vuetify-sort-by-to-sequelize-safe-order"
import useChildCareSpaceCategories, {
  type ChildCareSpaceCategoryAsIndex,
  type ChildCareSpaceCategoryFiltersOptions,
  type ChildCareSpaceCategoryWhereOptions,
} from "@/use/use-child-care-space-categories"

const monthlyAmountFormatOptions = { minimumFractionDigits: 2, maximumFractionDigits: 4 }

const props = withDefaults(
  defineProps<{
    filters?: ChildCareSpaceCategoryFiltersOptions
    where?: ChildCareSpaceCategoryWhereOptions
    waiting?: boolean
  }>(),
  {
    filters: () => ({}),
    where: () => ({}),
    waiting: false,
  }
)

const headers = computed(() => [
  { title: "Category Name", key: "categoryName" },
  { title: "From Age", key: "fromAge" },
  { title: "To Age", key: "toAge" },
  { title: "Monthly Amount", key: "monthlyAmount" },
  { title: "Actions", key: "actions", sortable: false },
])

const page = useRouteQuery<string | undefined, number | undefined>("page", "1", {
  transform: integerTransformer,
})
const perPage = useRouteQuery<string | undefined, number | undefined>("perPage", "10", {
  transform: integerTransformer,
})
const sortBy = useVuetifySortByToSafeRouteQuery("sortBy", [{ key: "categoryName", order: "asc" }])
const order = useVuetifySortByToSequelizeSafeOrder(sortBy)

const childCareSpaceCategoriesQuery = computed(() => ({
  filters: props.filters,
  where: props.where,
  order: order.value,
  page: page.value,
  perPage: perPage.value,
}))
const { childCareSpaceCategories, totalCount, isLoading, isErrored } = useChildCareSpaceCategories(
  childCareSpaceCategoriesQuery,
  {
    skipWatchIf: () => props.waiting,
  }
)

const router = useRouter()

type ChildCareSpaceCategoryTableRow = {
  item: ChildCareSpaceCategoryAsIndex
}

function goToChildCareSpaceCategoryPage(childCareSpaceCategoryId: number) {
  router.push({
    name: "administration/child-care-space-categories/ChildCareSpaceCategoryPage",
    params: {
      childCareSpaceCategoryId,
    },
  })
}
</script>
