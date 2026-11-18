<template>
  <v-skeleton-loader
    v-if="isNil(childCareCategory)"
    type="chip"
  />
  <v-chip
    v-else
    v-bind="$attrs"
    :loading="isLoading"
    variant="text"
    :class="classes"
    :size="size"
  >
    {{ childCareCategory.categoryName }}
  </v-chip>
</template>

<!-- Special module scope (non-setup) required for exports -->
<script lang="ts">
export { type ChildCareCategoryAsShow } from "@/use/use-child-care-category"
</script>

<script setup lang="ts">
import { toRefs } from "vue"
import { isNil } from "lodash"

import { type VChip } from "vuetify/components"

import useChildCareCategory from "@/use/use-child-care-category"

const props = withDefaults(
  defineProps<{
    childCareCategoryId: number | null | undefined
    classes?: Record<string, boolean> | string[] | string
    size?: VChip["size"]
  }>(),
  {
    classes: "cursor-pointer",
    size: "large",
  }
)

const { childCareCategoryId } = toRefs(props)
const { childCareCategory, isLoading } = useChildCareCategory(childCareCategoryId)
</script>
