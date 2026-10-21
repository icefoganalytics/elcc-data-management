<template>
  <HeaderActionsCard title="Edit Quality Enhancement Category">
    <QualityEnhancementCategoryEditForm
      :key="qualityEnhancementCategoryIdAsNumber"
      :quality-enhancement-category-id="qualityEnhancementCategoryIdAsNumber"
      @saved="redirectToQualityEnhancementCategoryPage"
    />
  </HeaderActionsCard>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useRouter } from "vue-router"

import useBreadcrumbs from "@/use/use-breadcrumbs"

import HeaderActionsCard from "@/components/common/HeaderActionsCard.vue"
import QualityEnhancementCategoryEditForm from "@/components/quality-enhancement-categories/QualityEnhancementCategoryEditForm.vue"

const router = useRouter()

const props = defineProps<{
  qualityEnhancementCategoryId: string
}>()

const qualityEnhancementCategoryIdAsNumber = computed(() =>
  parseInt(props.qualityEnhancementCategoryId)
)

function redirectToQualityEnhancementCategoryPage(qualityEnhancementCategoryId: number) {
  return router.push({
    name: "administration/quality-enhancement-categories/QualityEnhancementCategoryPage",
    params: {
      qualityEnhancementCategoryId,
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
    title: "Quality Enhancement Categories",
    to: {
      name: "administration/QualityEnhancementCategoriesPage",
    },
  },
  {
    title: "Edit",
    to: {
      name: "administration/quality-enhancement-categories/QualityEnhancementCategoryEditPage",
      params: {
        qualityEnhancementCategoryId: props.qualityEnhancementCategoryId,
      },
    },
  },
]

useBreadcrumbs("Edit", breadcrumbs)
</script>
