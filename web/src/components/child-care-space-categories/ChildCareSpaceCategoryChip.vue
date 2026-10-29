<template>
  <v-skeleton-loader
    v-if="isNil(childCareSpaceCategory)"
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
    {{ childCareSpaceCategory.categoryName }}
  </v-chip>
</template>

<!-- Special module scope (non-setup) required for exports -->
<script lang="ts">
export { type ChildCareSpaceCategoryAsShow } from "@/use/use-child-care-space-category"
</script>

<script setup lang="ts">
import { toRefs } from "vue"
import { isNil } from "lodash"

import { type VChip } from "vuetify/components"

import useChildCareSpaceCategory from "@/use/use-child-care-space-category"

const props = withDefaults(
  defineProps<{
    childCareSpaceCategoryId: number | null | undefined
    classes?: Record<string, boolean> | string[] | string
    size?: VChip["size"]
  }>(),
  {
    classes: "cursor-pointer",
    size: "large",
  }
)

const { childCareSpaceCategoryId } = toRefs(props)
const { childCareSpaceCategory, isLoading } = useChildCareSpaceCategory(childCareSpaceCategoryId)
</script>
