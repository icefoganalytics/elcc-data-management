<template>
  <v-text-field
    v-model="search"
    label="Search"
    append-inner-icon="mdi-magnify"
    density="compact"
    clearable
    hide-details
  />
</template>

<script setup lang="ts">
import { onScopeDispose, watch } from "vue"
import { debounce } from "lodash"
import { useRouteQuery } from "@vueuse/router"

import { stringTransformer } from "@/utils/use-route-query-transformers"

const props = withDefaults(
  defineProps<{
    modelValue: string
    routeQuerySuffix?: string
  }>(),
  {
    routeQuerySuffix: "",
  }
)

const emit = defineEmits<{
  "update:modelValue": [search: string]
}>()

const search = useRouteQuery<string, string>(`search${props.routeQuerySuffix}`, "", {
  transform: stringTransformer,
})

function emitSearchUpdate(value: string) {
  emit("update:modelValue", value)
}

const debouncedEmitSearchUpdate = debounce(emitSearchUpdate, 500)

watch(
  search,
  (value, previousValue) => {
    if (previousValue === undefined) {
      emitSearchUpdate(value)
    } else {
      debouncedEmitSearchUpdate(value)
    }
  },
  { immediate: true }
)

onScopeDispose(() => debouncedEmitSearchUpdate.cancel())
</script>
