<template>
  <v-list-item v-bind="$attrs">
    <template #prepend>
      <v-icon color="primary">mdi-dots-grid</v-icon>
    </template>
    <template #append>
      <slot name="append"></slot>
    </template>
    <template #default>
      <p>{{ childCareCategory.categoryName }}</p>
      <slot name="default"></slot>
    </template>
  </v-list-item>
</template>

<script lang="ts" setup>
import { type ChildCareCategoryAsIndex } from "@/api/child-care-categories-api"

defineProps<{
  childCareCategory: ChildCareCategoryAsIndex
}>()

defineSlots<{
  default(): unknown
  append(): unknown
}>()
</script>
