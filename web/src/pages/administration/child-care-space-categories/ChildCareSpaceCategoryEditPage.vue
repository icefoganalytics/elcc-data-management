<template>
  <HeaderActionsCard title="Edit Child Care Space Category">
    <ChildCareSpaceCategoryEditForm
      :child-care-space-category-id="childCareSpaceCategoryIdAsNumber"
      @saved="redirectToChildCareSpaceCategoryPage"
    />
  </HeaderActionsCard>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useRouter } from "vue-router"

import useBreadcrumbs from "@/use/use-breadcrumbs"

import HeaderActionsCard from "@/components/common/HeaderActionsCard.vue"
import ChildCareSpaceCategoryEditForm from "@/components/child-care-space-categories/ChildCareSpaceCategoryEditForm.vue"

const router = useRouter()

const props = defineProps<{
  childCareSpaceCategoryId: string
}>()

const childCareSpaceCategoryIdAsNumber = computed(() => parseInt(props.childCareSpaceCategoryId))

function redirectToChildCareSpaceCategoryPage(childCareSpaceCategoryId: number) {
  return router.push({
    name: "administration/child-care-space-categories/ChildCareSpaceCategoryPage",
    params: {
      childCareSpaceCategoryId,
    },
  })
}

const breadcrumbs = [
  {
    title: "Administration",
    to: {
      name: "AdministrationPage",
    },
  },
  {
    title: "Child Care Space Categories",
    to: {
      name: "administration/ChildCareSpaceCategoriesPage",
    },
  },
  {
    title: "Edit",
    to: {
      name: "administration/child-care-space-categories/ChildCareSpaceCategoryEditPage",
      params: {
        childCareSpaceCategoryId: props.childCareSpaceCategoryId,
      },
    },
  },
]

useBreadcrumbs("Edit", breadcrumbs)
</script>
