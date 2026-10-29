<template>
  <DescriptionElement
    label="Child Care Space Category"
    :model-value="childCareSpaceCategory?.categoryName ?? 'Unknown'"
    :loading="isLoading"
  />
</template>

<script setup lang="ts">
import { toRefs } from "vue"

import useChildCareSpaceCategory from "@/use/use-child-care-space-category"

import DescriptionElement from "@/components/common/DescriptionElement.vue"

const props = defineProps<{
  childCareSpaceCategoryId: number | null | undefined
}>()

const { childCareSpaceCategoryId } = toRefs(props)
const { childCareSpaceCategory, isLoading } = useChildCareSpaceCategory(childCareSpaceCategoryId)
</script>
