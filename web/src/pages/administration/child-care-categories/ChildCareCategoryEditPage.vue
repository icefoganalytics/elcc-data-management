<template>
  <HeaderActionsCard title="Edit Child Care Category">
    <ChildCareCategoryEditForm
      :key="childCareCategoryIdAsNumber"
      :child-care-category-id="childCareCategoryIdAsNumber"
      @saved="redirectToChildCareCategoryPage"
    />
  </HeaderActionsCard>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useRouter } from "vue-router"

import useBreadcrumbs from "@/use/use-breadcrumbs"

import HeaderActionsCard from "@/components/common/HeaderActionsCard.vue"
import ChildCareCategoryEditForm from "@/components/child-care-categories/ChildCareCategoryEditForm.vue"

const router = useRouter()

const props = defineProps<{
  childCareCategoryId: string
}>()

const childCareCategoryIdAsNumber = computed(() => parseInt(props.childCareCategoryId))

function redirectToChildCareCategoryPage(childCareCategoryId: number) {
  return router.push({
    name: "administration/child-care-categories/ChildCareCategoryPage",
    params: {
      childCareCategoryId,
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
    title: "Child Care Categories",
    to: {
      name: "administration/ChildCareCategoriesPage",
    },
  },
  {
    title: "Edit",
    to: {
      name: "administration/child-care-categories/ChildCareCategoryEditPage",
      params: {
        childCareCategoryId: props.childCareCategoryId,
      },
    },
  },
]

useBreadcrumbs("Edit", breadcrumbs)
</script>
