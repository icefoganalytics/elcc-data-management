<template>
  <v-data-table-server
    v-model:items-per-page="perPage"
    v-model:sort-by="sortBy"
    :page="page"
    :headers="headers"
    :items="isErrored ? [] : administrationCostCategories"
    :items-length="totalCount"
    :loading="isLoading"
    density="comfortable"
    class="row-clickable"
    @dblclick:row="
      (_event: unknown, { item }: AdministrationCostCategoryTableRow) =>
        goToAdministrationCostCategoryPage(item)
    "
    @update:page="updatePage"
  >
    <template #top="slotProps">
      <v-alert
        v-if="isErrored"
        type="error"
        variant="tonal"
        class="mb-4"
      >
        Administration categories could not be loaded. Try again by changing a filter or reloading
        the page.
      </v-alert>
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
    <template #item.monthlyAmount="{ item }">
      {{ formatMoney(item.monthlyAmount, monthlyAmountFormatOptions) }}
    </template>
    <template #item.actions="{ item }">
      <v-btn
        color="secondary"
        variant="outlined"
        :to="buildAdministrationCostCategoryTo(item)"
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
import useAdministrationCostCategories, {
  type AdministrationCostCategoryAsIndex,
  type AdministrationCostCategoryFiltersOptions,
  type AdministrationCostCategoryWhereOptions,
} from "@/use/use-administration-cost-categories"

const props = withDefaults(
  defineProps<{
    filters?: AdministrationCostCategoryFiltersOptions
    where?: AdministrationCostCategoryWhereOptions
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

const administrationCostCategoriesQuery = computed(() => {
  return {
    filters: props.filters,
    where: props.where,
    order: order.value,
    page: page.value,
    perPage: perPage.value,
  }
})
const { administrationCostCategories, totalCount, isLoading, isErrored } =
  useAdministrationCostCategories(administrationCostCategoriesQuery)

// Necessary to avoid wiping page value due to bug in Vuetify table implementation
// which causes page value to be wiped if changed during loading state.
function updatePage(newPage: number) {
  if (isLoading.value) return

  page.value = newPage
}

const router = useRouter()

type AdministrationCostCategoryTableRow = {
  item: AdministrationCostCategoryAsIndex
}

function buildAdministrationCostCategoryTo(item: AdministrationCostCategoryAsIndex) {
  return {
    name: "administration/administration-cost-categories/AdministrationCostCategoryPage",
    params: {
      administrationCostCategoryId: item.id,
    },
  }
}

function goToAdministrationCostCategoryPage(item: AdministrationCostCategoryAsIndex) {
  const route = buildAdministrationCostCategoryTo(item)

  return router.push(route)
}
</script>
