import { useRouteQuery } from "@vueuse/router"

import { integerTransformer } from "@/utils/use-route-query-transformers"

import useVuetifySortByToSafeRouteQuery, {
  type SortItem,
} from "@/use/vuetify/use-vuetify-sort-by-to-safe-route-query"
import useVuetifySortByToSequelizeSafeOrder from "@/use/vuetify/use-vuetify-sort-by-to-sequelize-safe-order"

export function useRouteQueriableTableOptions(
  options: {
    routeQuerySuffix?: string
    page?: number
    perPage?: number
    sortBy?: SortItem[]
  } = {}
) {
  const routeQuerySuffix = options.routeQuerySuffix ?? ""
  const defaultPage = String(options.page ?? 1)
  const defaultPerPage = String(options.perPage ?? 10)

  const page = useRouteQuery<string, number>(`page${routeQuerySuffix}`, defaultPage, {
    transform: integerTransformer,
  })
  const perPage = useRouteQuery<string, number>(`perPage${routeQuerySuffix}`, defaultPerPage, {
    transform: integerTransformer,
  })
  const sortBy = useVuetifySortByToSafeRouteQuery(`sortBy${routeQuerySuffix}`, options.sortBy)
  const order = useVuetifySortByToSequelizeSafeOrder(sortBy)

  return {
    page,
    perPage,
    sortBy,
    order,
  }
}

export default useRouteQueriableTableOptions
