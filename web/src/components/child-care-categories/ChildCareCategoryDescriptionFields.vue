<template>
  <DescriptionElement
    label="Child Care Category"
    :model-value="category.categoryName"
    vertical
  />
  <DescriptionElement
    label="From Age"
    :model-value="category.fromAge ?? '—'"
    vertical
  />
  <DescriptionElement
    label="To Age"
    :model-value="category.toAge ?? '—'"
    vertical
  />
  <v-btn
    v-if="isSystemAdmin"
    variant="text"
    :to="{
      name: 'administration/child-care-categories/ChildCareCategoryEditPage',
      params: {
        childCareCategoryId,
      },
    }"
  >
    Edit shared category name and ages
  </v-btn>
</template>

<script setup lang="ts">
import { type ChildCareCategory } from "@/api/child-care-categories-api"

import useCurrentUser from "@/use/use-current-user"

import DescriptionElement from "@/components/common/DescriptionElement.vue"

defineProps<{
  childCareCategoryId: number
  category: Pick<ChildCareCategory, "categoryName" | "fromAge" | "toAge">
}>()

const { isSystemAdmin } = useCurrentUser()
</script>
