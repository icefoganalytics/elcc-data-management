<template>
  <v-list-item v-bind="$attrs">
    <template #prepend>
      <v-icon color="primary">mdi-dots-grid</v-icon>
    </template>
    <template #append>
      <slot name="append"></slot>
    </template>
    <template #default>
      <p>{{ childCareSpaceCategory.categoryName }}</p>
      <slot name="default"></slot>
    </template>
  </v-list-item>
</template>

<script lang="ts" setup>
import { type ChildCareSpaceCategoryAsIndex } from "@/api/child-care-space-categories-api"

defineProps<{
  childCareSpaceCategory: ChildCareSpaceCategoryAsIndex
}>()

defineSlots<{
  default(): unknown
  append(): unknown
}>()
</script>
